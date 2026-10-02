import React, { createContext, useContext, useState, useEffect } from 'react';
const ThemeContext = createContext();
export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // default dark
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  return <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(p => !p) }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
