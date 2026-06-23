"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "../../locales/en.json";
import gu from "../../locales/gu.json";
import hi from "../../locales/hi.json";

type Language = "en" | "gu" | "hi";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

const translations = {
  en,
  gu,
  hi,
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("mehta_language") as Language;
    if (saved && ["en", "gu", "hi"].includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("mehta_language", lang);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let result: any = translations[language];
    // In this simple flat structure, we can just look up the key directly
    return result[key] || translations["en"][key as keyof typeof en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
