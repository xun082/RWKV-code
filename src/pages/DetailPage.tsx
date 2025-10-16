import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Eye, Code2, Copy, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center p-4">
  <div class="text-center">
    <h1 class="text-4xl font-bold text-gray-800 mb-4">Welcome!</h1>
    <p class="text-gray-600">Start editing to see your changes</p>
  </div>
</body>
</html>`;

export const DetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 从路由状态中获取传递的数据
  const initialHtmlCode =
    (location.state as { htmlCode?: string; index?: number })?.htmlCode ||
    DEFAULT_HTML;
  const resultIndex = (location.state as { htmlCode?: string; index?: number })
    ?.index;

  const [htmlCode, setHtmlCode] = useState(initialHtmlCode);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialHtmlCode) {
      setHtmlCode(initialHtmlCode);
    }
  }, [initialHtmlCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(t('detailpage.copyFailed'), error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design-${resultIndex !== undefined ? resultIndex + 1 : 'export'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-background dark:bg-[#1e1e1e]">
      {/* 顶部工具栏 */}
      <div className="h-14 border-b border-border dark:border-gray-700 bg-white dark:bg-[#252525] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('detailpage.back')}
          </button>
          {resultIndex !== undefined && (
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('detailpage.solution', { number: resultIndex + 1 })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 操作按钮 */}
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Copy className="h-4 w-4" />
              {copied ? t('detailpage.copied') : t('detailpage.copyCode')}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              {t('detailpage.download')}
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域：左右布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：代码编辑器 */}
        <div className="w-1/2 border-r border-border dark:border-gray-700 bg-[#1e1e1e]">
          <div className="h-full flex flex-col">
            <div className="px-4 py-2 bg-[#252525] border-b border-gray-700">
              <span className="text-sm text-gray-300 font-medium flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                {t('detailpage.codeEditor')}
              </span>
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                defaultLanguage="html"
                value={htmlCode}
                onChange={(value) => setHtmlCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </div>
          </div>
        </div>

        {/* 右侧：预览效果 */}
        <div className="w-1/2 bg-white">
          <div className="h-full flex flex-col">
            <div className="px-4 py-2 bg-gray-50 dark:bg-[#252525] border-b border-border dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {t('detailpage.preview')}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('detailpage.updateRealtime')}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe
                srcDoc={htmlCode}
                className="w-full h-full border-0 bg-white"
                title="Preview"
                sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
