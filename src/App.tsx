import { useState } from 'react';
import { ChatgptPromptInput } from '@/components/business/chatgpt-prompt-input';

const App = () => {
  const [inputValue, setInputValue] = useState('');

  const suggestions = [
    'Create a login page',
    'Create a multi-step form',
    'Create a dashboard',
    'Create a blog',
    'Create a landing page',
    'Create a pricing page',
    'Create a contact page',
    'Create a product page',
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 dark:from-[#212121] dark:to-[#212121] p-4">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-8">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-semibold text-foreground dark:text-white text-center">
          What do you want to build?
        </h1>

        {/* Input */}
        <div className="w-full">
          <ChatgptPromptInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Create a pricing page..."
          />
        </div>

        {/* Suggestions */}
        <div className="w-full flex flex-wrap items-center justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-secondary hover:bg-secondary/80 dark:bg-[#3b4045] dark:hover:bg-[#515151] text-secondary-foreground dark:text-white transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <p className="text-sm text-muted-foreground dark:text-gray-400 text-center">
          <span className="font-medium">2 messages left</span>, upgrade to Pro
          for more
        </p>
      </div>
    </div>
  );
};

export default App;
