import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatgptPromptInput } from '@/components/business/chatgpt-prompt-input';

export const HomePage = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');

  const suggestions = [
    '用HTML创建一个鲁迅纪念馆网站，包含生平介绍、文学作品展示和历史照片画廊',
    '用HTML设计一个极简风格的个人作品集网站，采用现代配色和网格布局',
    '用HTML创建一个温馨的本地咖啡馆官网，使用暖色调和优雅的排版',
    '用HTML构建一个专业的SaaS产品落地页，包含功能介绍和定价方案',
    '用HTML设计一个响应式的在线教育平台首页，展示课程和师资力量',
    '用HTML创建一个高端的房地产展示网站，包含3D户型图和虚拟看房',
    '用HTML构建一个现代化的企业官网，包含团队介绍和案例展示',
    '用HTML设计一个艺术画廊展览网站，采用沉浸式的视觉呈现',
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    // 可选：直接提交建议，无需手动确认
    // handleSubmit(suggestion);
  };

  const handleSubmit = (content: string) => {
    if (content.trim()) {
      // 清空之前的缓存，准备开始新的会话
      sessionStorage.removeItem('chatPageResults');
      sessionStorage.removeItem('chatPagePrompt');
      sessionStorage.removeItem('hasProcessedInitialMessage');

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
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-5 py-3.5 rounded-lg text-sm font-medium bg-secondary hover:bg-secondary/80 dark:bg-[#2d3135] dark:hover:bg-[#3b4045] text-secondary-foreground dark:text-white transition-all duration-200 cursor-pointer text-left border border-transparent hover:border-primary/20 dark:hover:border-white/10"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
