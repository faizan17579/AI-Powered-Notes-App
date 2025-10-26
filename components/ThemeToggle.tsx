import React, { useState, useEffect } from 'react';

/**
 * ThemeToggle Component
 * 
 * Animated theme toggle switch with localStorage persistence.
 * Features:
 * - Smooth animated toggle between light and dark modes
 * - Persists theme preference in localStorage
 * - Respects system preference on first visit
 * - Accessible with proper ARIA labels
 * - Beautiful sun/moon icon animations
 * 
 * Usage:
 * <ThemeToggle />
 */
const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);
    
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
    
    // Save initial preference if not set
    if (!savedTheme) {
      localStorage.setItem('theme', shouldBeDark ? 'dark' : 'light');
    }
  }, []);

  // Handle theme toggle
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    // Update DOM
    document.documentElement.classList.toggle('dark', newTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-12 h-6 bg-gray-200 rounded-full animate-pulse"></div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative w-12 h-6 rounded-full transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${isDark ? 'bg-primary-600' : 'bg-gray-300'}
        hover:scale-105 active:scale-95
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Toggle circle */}
      <div
        className={`
          absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ease-in-out
          flex items-center justify-center
          ${isDark ? 'translate-x-6 bg-white' : 'translate-x-0.5 bg-white'}
          shadow-lg
        `}
      >
        {/* Icon inside toggle */}
        <div className="relative w-3 h-3">
          {/* Sun icon */}
          <svg
            className={`
              absolute inset-0 w-3 h-3 text-yellow-500 transition-all duration-300
              ${isDark ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100'}
            `}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
          
          {/* Moon icon */}
          <svg
            className={`
              absolute inset-0 w-3 h-3 text-gray-700 transition-all duration-300
              ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-0'}
            `}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </div>
      </div>
      
      {/* Background stars for dark mode */}
      <div
        className={`
          absolute inset-0 rounded-full transition-opacity duration-300
          ${isDark ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <div className="absolute top-1 left-2 w-0.5 h-0.5 bg-white rounded-full"></div>
        <div className="absolute top-3 right-3 w-0.5 h-0.5 bg-white rounded-full"></div>
        <div className="absolute bottom-2 left-4 w-0.5 h-0.5 bg-white rounded-full"></div>
      </div>
    </button>
  );
};

export default ThemeToggle;
