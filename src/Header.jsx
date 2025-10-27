import React, { useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import { Sun, Moon } from 'lucide-react';

const Header = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">GPT OSS</h1>
      <button onClick={toggleTheme} className="p-2 rounded-full focus:outline-none hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
        {theme === 'light' ? <Moon className="text-gray-500" /> : <Sun className="text-yellow-500" />}
      </button>
    </header>
  );
};

export default Header;
