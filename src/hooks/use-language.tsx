'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, TranslationKey } from '@/lib/i18n/translations';

interface LanguageContextType {
  language: string | null;
  setLanguage: (lang: string) => void;
  t: (key: TranslationKey, replacements?: Record<string, string>) => string;
  isLanguageLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string | null>(null);
  const [isLanguageLoading, setIsLanguageLoading] = useState(true);

  useEffect(() => {
    try {
      const storedLang = localStorage.getItem('selectedLanguage');
      if (storedLang) {
        setLanguageState(storedLang);
      }
    } catch (error) {
      console.error('Could not access localStorage', error);
    } finally {
      setIsLanguageLoading(false);
    }
  }, []);

  const setLanguage = (lang: string) => {
    try {
      localStorage.setItem('selectedLanguage', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Could not access localStorage', error);
    }
  };

  const t = useCallback(
    (key: TranslationKey, replacements: Record<string, string> = {}): string => {
      const lang = language || 'en';
      const langTranslations = translations[lang as keyof typeof translations] || translations.en;
      
      let text = langTranslations[key] || translations.en[key] || key;
      
      Object.keys(replacements).forEach(placeholder => {
          text = text.replace(`{{${placeholder}}}`, replacements[placeholder]);
      });

      return text;
    },
    [language]
  );
  

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLanguageLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
