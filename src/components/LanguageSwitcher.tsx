"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGES, Language } from "@/lib/translations";

interface LanguageSwitcherProps {
  variant?: "header" | "sidebar" | "card";
  className?: string;
}

export default function LanguageSwitcher({ variant = "header", className = "" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentOption = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const handleSelect = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  if (variant === "card") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
        {LANGUAGES.map((l) => {
          const isSelected = language === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => handleSelect(l.code)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition text-left ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs ring-2 ring-indigo-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{l.flag}</span>
                <div>
                  <p className="font-bold text-sm leading-tight">{l.nativeName}</p>
                  <p className="text-xs text-slate-500">{l.name}</p>
                </div>
              </div>
              {isSelected && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-[0.98]"
        aria-label="Change Language"
      >
        <Globe className="h-3.5 w-3.5 text-indigo-600" />
        <span>{currentOption.nativeName}</span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="space-y-0.5">
            {LANGUAGES.map((l) => {
              const isSelected = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelect(l.code)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-700 font-bold"
                      : "text-slate-700 hover:bg-slate-100/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{l.flag}</span>
                    <span>{l.nativeName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({l.name})</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
