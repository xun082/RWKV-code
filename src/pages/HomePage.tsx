import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatgptPromptInput } from '@/components/business/chatgpt-prompt-input';

export const HomePage = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');

  const suggestions = [
    '创建一个登录页面',
    '创建一个多步骤表单',
    '创建一个仪表盘',
    '创建一个博客页面',
    '创建一个落地页',
    '创建一个价格页面',
    '创建一个联系我们页面',
    '创建一个产品展示页面',
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleSubmit = (content: string) => {
    if (content.trim()) {
      // 跳转到聊天页面，并传递初始消息
      navigate('/chat', { state: { initialMessage: content } });
      // 清空输入框
      setInputValue('');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 dark:from-[#212121] dark:to-[#212121] p-4">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-8">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-semibold text-foreground dark:text-white text-center">
          你想创建什么？
        </h1>

        {/* Input */}
        <div className="w-full">
          <ChatgptPromptInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onSubmit={handleSubmit}
            placeholder="创建一个价格页面..."
          />
        </div>

        {/* Suggestions */}
        <div className="w-full flex flex-wrap items-center justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-secondary hover:bg-secondary/80 dark:bg-[#3b4045] dark:hover:bg-[#515151] text-secondary-foreground dark:text-white transition-colors cursor-pointer"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
