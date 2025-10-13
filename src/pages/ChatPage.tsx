import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { ChatgptPromptInput } from '@/components/business/chatgpt-prompt-input';
import { MarkdownRenderer } from '@/components/business/MarkdownRenderer';
import { Code2, Eye, Loader2 } from 'lucide-react';
import { AIService } from '@/service/ai';
import type { Message, ConversationMessage } from '@/types/chat';

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center p-4">
  <div class="text-center">
    <h1 class="text-4xl font-bold text-gray-800 mb-4">Welcome!</h1>
    <p class="text-gray-600">Tell me what you want to build, and I'll create it for you.</p>
  </div>
</body>
</html>`;

export const ChatPage = () => {
  const location = useLocation();
  const initialMessage = (location.state as { initialMessage?: string })
    ?.initialMessage;

  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('preview');
  const [htmlCode, setHtmlCode] = useState(DEFAULT_HTML);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理初始消息 - 只执行一次
  const hasProcessedInitialMessage = useRef(false);
  useEffect(() => {
    if (initialMessage && !hasProcessedInitialMessage.current) {
      hasProcessedInitialMessage.current = true;
      handleSendMessage(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async (content: string) => {
    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // 创建临时 AI 消息 ID
    const tempAIMessageId = (Date.now() + 1).toString();
    streamingMessageIdRef.current = tempAIMessageId;

    // 添加一个空的 AI 消息占位
    const placeholderMessage: Message = {
      id: tempAIMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, placeholderMessage]);

    try {
      // 构建对话历史
      const conversationHistory: ConversationMessage[] = messages.map(
        (msg) => ({
          role: msg.role,
          content: msg.content,
        }),
      );

      // 使用流式 API
      let fullContent = '';

      await AIService.streamChat(
        content,
        conversationHistory,
        (chunk: string) => {
          fullContent += chunk;

          // 实时更新消息内容
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAIMessageId
                ? { ...msg, content: fullContent }
                : msg,
            ),
          );

          // 实时检查是否有 HTML 代码可以预览
          const extractedHTML = AIService.extractHTMLCode(fullContent);
          if (extractedHTML) {
            const wrappedHTML = AIService.wrapHTML(extractedHTML);
            setHtmlCode(wrappedHTML);
          }
        },
      );

      // 流式结束后，最终更新一次
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempAIMessageId ? { ...msg, content: fullContent } : msg,
        ),
      );

      const finalHTML = AIService.extractHTMLCode(fullContent);
      if (finalHTML) {
        const wrappedHTML = AIService.wrapHTML(finalHTML);
        setHtmlCode(wrappedHTML);
      }
    } catch (error) {
      console.error('AI 调用失败:', error);
      // 更新为错误消息
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempAIMessageId
            ? { ...msg, content: '抱歉，我遇到了一些问题。请稍后再试。' }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
      streamingMessageIdRef.current = null;
    }
  };

  return (
    <div className="flex h-screen bg-background dark:bg-[#1e1e1e]">
      {/* 左侧聊天区域 */}
      <div className="w-[45%] flex flex-col border-r border-border dark:border-gray-700">
        {/* 聊天消息区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted dark:bg-[#2d2d2d] text-foreground dark:text-white'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                ) : (
                  <div className="text-sm leading-relaxed">
                    <MarkdownRenderer content={message.content} />
                    {isLoading &&
                      message.id === streamingMessageIdRef.current && (
                        <span className="inline-block w-2 h-4 ml-1 bg-blue-600 animate-pulse"></span>
                      )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 加载状态 */}
          {isLoading && messages.length === 0 && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted dark:bg-[#2d2d2d] text-foreground dark:text-white">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">AI 正在思考...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="p-4 border-t border-border dark:border-gray-700">
          <ChatgptPromptInput
            placeholder="Ask me anything..."
            onSubmit={handleSendMessage}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* 右侧编辑器/预览区域 */}
      <div className="flex-1 flex flex-col">
        {/* Tab 切换 */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border dark:border-gray-700 bg-muted/30 dark:bg-[#252525]">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-background dark:bg-[#1e1e1e] text-foreground dark:text-white shadow-sm'
                : 'text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white'
            }`}
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'code'
                ? 'bg-background dark:bg-[#1e1e1e] text-foreground dark:text-white shadow-sm'
                : 'text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white'
            }`}
          >
            <Code2 className="h-4 w-4" />
            Code
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden styled-scrollbar">
          {activeTab === 'preview' ? (
            <iframe
              srcDoc={htmlCode}
              className="w-full h-full border-0 bg-white"
              title="Preview"
              sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
            />
          ) : (
            <Editor
              height="100%"
              defaultLanguage="html"
              value={htmlCode}
              onChange={(value) => setHtmlCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                scrollbar: {
                  vertical: 'hidden',
                  horizontal: 'hidden',
                  useShadows: false,
                  verticalScrollbarSize: 0,
                  horizontalScrollbarSize: 0,
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
