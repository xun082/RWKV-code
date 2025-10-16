import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-8 px-16 py-8 rounded-3xl text-4xl font-bold
                 bg-white dark:bg-gray-800
                 hover:bg-gray-50 dark:hover:bg-gray-700
                 text-gray-900 dark:text-white 
                 shadow-2xl hover:shadow-3xl
                 transition-all duration-200 hover:scale-105
                 border-4 border-gray-200 dark:border-gray-600
                 hover:border-gray-300 dark:hover:border-gray-500"
    >
      <Globe className="h-14 w-14" />
      <span className="min-w-[160px] text-left">
        {i18n.language === 'zh' ? '中文' : 'English'}
      </span>
    </button>
  );
};
