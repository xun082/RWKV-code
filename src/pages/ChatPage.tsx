import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { ChatgptPromptInput } from '@/components/business/chatgpt-prompt-input';
import { Loader2 } from 'lucide-react';
import { AIService } from '@/service/ai';

interface GeneratedResult {
  id: string;
  content: string;
  htmlCode: string;
  isLoading: boolean;
}

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>加载中...</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center p-4">
  <div class="text-center">
    <div class="animate-pulse">
      <div class="h-8 w-48 bg-gray-300 rounded mx-auto mb-4"></div>
      <div class="h-4 w-64 bg-gray-200 rounded mx-auto"></div>
    </div>
  </div>
</body>
</html>`;

export const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialMessage = (location.state as { initialMessage?: string })
    ?.initialMessage;

  // 从 sessionStorage 恢复状态
  const [results, setResults] = useState<GeneratedResult[]>(() => {
    const saved = sessionStorage.getItem('chatPageResults');
    return saved ? JSON.parse(saved) : [];
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState(() => {
    return sessionStorage.getItem('chatPagePrompt') || '';
  });
  const totalCount = 24;

  // 存储每个编辑器实例的引用
  const editorRefs = useRef<Map<number, any>>(new Map());

  // 编辑器挂载回调
  const handleEditorMount = useCallback(
    (editorInstance: any, index: number) => {
      editorRefs.current.set(index, editorInstance);
    },
    [],
  );

  // 滚动编辑器到底部
  const scrollEditorToBottom = useCallback((index: number) => {
    const editorInstance = editorRefs.current.get(index);
    if (editorInstance) {
      const model = editorInstance.getModel();
      if (model) {
        const lineCount = model.getLineCount();
        editorInstance.revealLine(lineCount, 1); // 1 = Immediate
      }
    }
  }, []);

  // 监听结果变化，自动滚动正在生成的编辑器
  useEffect(() => {
    if (isGenerating) {
      results.forEach((result, index) => {
        if (!result.isLoading && result.htmlCode) {
          scrollEditorToBottom(index);
        }
      });
    }
  }, [results, isGenerating, scrollEditorToBottom]);

  // 保存状态到 sessionStorage
  useEffect(() => {
    if (results.length > 0) {
      sessionStorage.setItem('chatPageResults', JSON.stringify(results));
    }
  }, [results]);

  useEffect(() => {
    if (prompt) {
      sessionStorage.setItem('chatPagePrompt', prompt);
    }
  }, [prompt]);

  // 处理初始消息 - 只执行一次，并且如果已经有结果就不重复执行
  const hasProcessedInitialMessage = useRef(false);
  useEffect(() => {
    // 如果已经有保存的结果，说明之前已经生成过了，不需要再处理
    const hasExistingResults = results.length > 0 && !results[0]?.isLoading;

    if (
      initialMessage &&
      !hasProcessedInitialMessage.current &&
      !hasExistingResults
    ) {
      hasProcessedInitialMessage.current = true;
      // 标记已处理，避免返回后重复执行
      sessionStorage.setItem('hasProcessedInitialMessage', 'true');
      handleGenerate(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async (userPrompt: string) => {
    setPrompt(userPrompt);
    setIsGenerating(true);

    // 清除旧的结果和标记
    sessionStorage.removeItem('chatPageResults');
    sessionStorage.removeItem('hasProcessedInitialMessage');

    // 初始化 20 个占位符
    const placeholders: GeneratedResult[] = Array.from(
      { length: totalCount },
      (_, i) => ({
        id: `result-${i}`,
        content: '',
        htmlCode: DEFAULT_HTML,
        isLoading: true,
      }),
    );
    setResults(placeholders);

    // 追踪哪些index已经开始接收数据（用于计数）
    const startedIndexes = new Set<number>();

    try {
      await AIService.generateMultipleResponses(
        userPrompt,
        totalCount,
        (index, content, htmlCode) => {
          // 实时更新每个结果
          setResults((prev) =>
            prev.map((result, i) =>
              i === index
                ? {
                    ...result,
                    content,
                    htmlCode,
                    isLoading: false,
                  }
                : result,
            ),
          );

          // 标记该index已开始接收数据
          if (!startedIndexes.has(index)) {
            startedIndexes.add(index);
          }
        },
      );
    } catch (error) {
      console.error('生成失败:', error);
      // 将所有仍在加载的卡片标记为加载完成
      setResults((prev) =>
        prev.map((result) => ({ ...result, isLoading: false })),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenDetail = (index: number) => {
    if (results[index] && !results[index].isLoading) {
      // 保存当前状态到 sessionStorage，确保返回时不会丢失
      sessionStorage.setItem('chatPageResults', JSON.stringify(results));
      sessionStorage.setItem('chatPagePrompt', prompt);

      navigate('/detail', {
        state: {
          htmlCode: results[index].htmlCode,
          index: index,
        },
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background dark:bg-[#1e1e1e]">
      {/* 顶部：输入区域 */}
      <div className="border-b border-border dark:border-gray-700 bg-white dark:bg-[#252525]">
        <div className="max-w-4xl mx-auto p-4">
          <ChatgptPromptInput
            placeholder="描述你想要创建的网页..."
            onSubmit={handleGenerate}
            disabled={isGenerating}
          />
        </div>
      </div>

      {/* 中间：网页预览网格 */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-[#1a1a1a]">
        <div
          className="grid grid-cols-12 gap-4 mx-auto"
          style={{ maxWidth: '10000px' }}
        >
          {results.map((result, index) => (
            <div
              key={result.id}
              className="group flex flex-col rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 transition-all hover:shadow-xl cursor-pointer"
              onClick={() => handleOpenDetail(index)}
            >
              {result.isLoading ? (
                <div className="w-full h-[1760px] bg-white dark:bg-[#2d2d2d] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <>
                  {/* 上部分：预览效果 */}
                  <div className="relative h-[1700px] bg-white border-b-2 border-gray-300 dark:border-gray-600 overflow-auto">
                    <iframe
                      srcDoc={result.htmlCode || DEFAULT_HTML}
                      className="w-full border-0 bg-white block pointer-events-none"
                      title={`Preview ${index + 1}`}
                      sandbox="allow-scripts"
                      scrolling="no"
                      style={{ height: '200vh' }}
                    />
                  </div>

                  {/* 下部分：代码 */}
                  <div className="h-[260px] bg-[#1e1e1e] relative">
                    <div className="absolute top-0 left-0 right-0 px-3 py-2 bg-[#252525] border-b border-gray-700 z-10">
                      <span className="text-xs text-gray-400 font-mono">
                        HTML Code
                      </span>
                    </div>
                    <div className="pt-8 h-full">
                      <Editor
                        height="100%"
                        defaultLanguage="html"
                        value={result.htmlCode}
                        theme="vs-dark"
                        onMount={(editor) => handleEditorMount(editor, index)}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 11,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          wordWrap: 'off',
                          scrollbar: {
                            vertical: 'auto',
                            horizontal: 'auto',
                            verticalScrollbarSize: 8,
                            horizontalScrollbarSize: 8,
                          },
                          folding: false,
                          glyphMargin: false,
                          lineDecorationsWidth: 0,
                          lineNumbersMinChars: 3,
                          padding: { top: 4, bottom: 4 },
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
