import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { ChatgptPromptInput } from '@/components/business/chatgpt-prompt-input';
import { Loader2, Check, Maximize2, Trash2 } from 'lucide-react';
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState(() => {
    return sessionStorage.getItem('chatPagePrompt') || '';
  });
  const [completedCount, setCompletedCount] = useState(0);
  const totalCount = 20;

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
    setCompletedCount(0);
    setSelectedIndex(null);

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
                ? { ...result, content, htmlCode, isLoading: false }
                : result,
            ),
          );

          // 只在第一次收到某个index的数据时增加计数
          if (!startedIndexes.has(index)) {
            startedIndexes.add(index);
            setCompletedCount(startedIndexes.size);
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

  const handleClearResults = () => {
    setResults([]);
    setPrompt('');
    setSelectedIndex(null);
    sessionStorage.removeItem('chatPageResults');
    sessionStorage.removeItem('chatPagePrompt');
    sessionStorage.removeItem('hasProcessedInitialMessage');
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
          {isGenerating && (
            <div className="mt-3 flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                正在生成 {completedCount}/{totalCount} 个设计方案...
              </span>
            </div>
          )}
          {prompt && !isGenerating && (
            <div className="mt-2 flex items-center justify-center gap-3 max-w-4xl mx-auto">
              <div className="text-sm text-muted-foreground flex items-center gap-2 flex-1 min-w-0">
                <span className="flex-shrink-0">当前 Prompt:</span>
                <span className="font-medium truncate max-w-2xl" title={prompt}>
                  {prompt}
                </span>
              </div>
              <button
                onClick={handleClearResults}
                className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
              >
                <Trash2 className="h-3 w-3" />
                清空重新开始
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 中间：网页预览网格 */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-[#1a1a1a]">
        <div className="grid grid-cols-5 gap-4 max-w-[2000px] mx-auto">
          {results.map((result, index) => (
            <div
              key={result.id}
              className={`group flex flex-col rounded-lg overflow-hidden border-2 transition-all hover:shadow-xl ${
                selectedIndex === index
                  ? 'border-blue-500 shadow-lg shadow-blue-500/50'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
              }`}
            >
              {result.isLoading ? (
                <div className="w-full h-[610px] bg-white dark:bg-[#2d2d2d] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <>
                  {/* 上部分：预览效果 - 高度翻倍 */}
                  <div
                    className="relative h-[480px] bg-white border-b-2 border-gray-300 dark:border-gray-600 overflow-auto cursor-pointer"
                    onClick={() => setSelectedIndex(index)}
                    onDoubleClick={() => handleOpenDetail(index)}
                  >
                    <iframe
                      srcDoc={result.htmlCode}
                      className="w-full border-0 bg-white block pointer-events-none"
                      title={`Preview ${index + 1}`}
                      sandbox="allow-scripts"
                      style={{ height: '200vh' }}
                    />
                    {/* 全屏按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(index);
                      }}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      title="打开详情页编辑"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                    {/* 选中标记 */}
                    {selectedIndex === index && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white rounded-full p-1 shadow-lg">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    {/* 底部标签 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                      <span className="text-white text-xs font-semibold">
                        方案 {index + 1}
                      </span>
                    </div>
                  </div>

                  {/* 下部分：代码 - 高度减半 */}
                  <div
                    className="h-[130px] bg-[#1e1e1e] relative cursor-pointer"
                    onClick={() => setSelectedIndex(index)}
                    onDoubleClick={() => handleOpenDetail(index)}
                  >
                    <div className="absolute top-0 left-0 right-0 px-2 py-1 bg-[#252525] border-b border-gray-700">
                      <span className="text-[10px] text-gray-400 font-mono">
                        HTML Code
                      </span>
                    </div>
                    <div className="pt-6 h-full pointer-events-none">
                      <Editor
                        height="100%"
                        defaultLanguage="html"
                        value={result.htmlCode}
                        theme="vs-dark"
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 9,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          wordWrap: 'off',
                          scrollbar: {
                            vertical: 'auto',
                            horizontal: 'auto',
                            verticalScrollbarSize: 5,
                            horizontalScrollbarSize: 5,
                          },
                          folding: false,
                          glyphMargin: false,
                          lineDecorationsWidth: 0,
                          lineNumbersMinChars: 2,
                          padding: { top: 2, bottom: 2 },
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
