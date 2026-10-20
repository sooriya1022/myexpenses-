"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Language, translations, getCategoryTranslation } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  hasSelectedLanguage: boolean;
  confirmLanguageSelection: (lang?: Language) => void;
  t: (path: string, fallback?: string) => string;
  tCategory: (name: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_LANG_KEY = "myexpense_lang";
const STORAGE_SELECTED_KEY = "myexpense_lang_selected";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(true); // default true to avoid flashing on SSR
  const [mounted, setMounted] = useState(false);

  // Read language and selection flag on client mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedLang = localStorage.getItem(STORAGE_LANG_KEY) as Language | null;
      const isSelected = localStorage.getItem(STORAGE_SELECTED_KEY) === "true";

      if (savedLang && (savedLang === "en" || savedLang === "ta" || savedLang === "hi")) {
        setLanguageState(savedLang);
      }
      setHasSelectedLanguage(isSelected);
    } catch {
      // localStorage may fail in restricted iframes or disabled storage
      setHasSelectedLanguage(true);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
      document.cookie = `${STORAGE_LANG_KEY}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {
      console.warn("Could not save language to storage:", e);
    }
  }, []);

  const confirmLanguageSelection = useCallback(
    (lang?: Language) => {
      const chosen = lang || language;
      setLanguageState(chosen);
      setHasSelectedLanguage(true);
      try {
        localStorage.setItem(STORAGE_LANG_KEY, chosen);
        localStorage.setItem(STORAGE_SELECTED_KEY, "true");
        document.cookie = `${STORAGE_LANG_KEY}=${chosen}; path=/; max-age=31536000; SameSite=Lax`;
        document.cookie = `${STORAGE_SELECTED_KEY}=true; path=/; max-age=31536000; SameSite=Lax`;
      } catch (e) {
        console.warn("Could not save language confirmation:", e);
      }
    },
    [language]
  );

  // Translation function: path e.g. "common.save" or "dashboard.netBalance"
  const t = useCallback(
    (path: string, fallback?: string): string => {
      const parts = path.split(".");
      const activeDict = translations[language] as unknown as Record<string, unknown>;
      const enDict = translations.en as unknown as Record<string, unknown>;

      let currentActive: unknown = activeDict;
      let currentEn: unknown = enDict;

      for (const part of parts) {
        if (currentActive && typeof currentActive === "object" && part in currentActive) {
          currentActive = (currentActive as Record<string, unknown>)[part];
        } else {
          currentActive = undefined;
        }

        if (currentEn && typeof currentEn === "object" && part in currentEn) {
          currentEn = (currentEn as Record<string, unknown>)[part];
        } else {
          currentEn = undefined;
        }
      }

      if (typeof currentActive === "string") return currentActive;
      if (typeof currentEn === "string") return currentEn;
      return fallback || path;
    },
    [language]
  );

  const tCategory = useCallback(
    (name: string): string => {
      return getCategoryTranslation(name, language);
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        hasSelectedLanguage,
        confirmLanguageSelection,
        t,
        tCategory,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
