"use client";

import { useState } from "react";
import { Globe, ArrowRight, Check, Sparkles, Wallet } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGES, Language } from "@/lib/translations";
import { APP_NAME } from "@/lib/constants";

const LANGUAGE_DETAILS = [
  {
    code: "en" as Language,
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    sample: "Track personal expenses and budgets in ₹ INR with clarity.",
  },
  {
    code: "ta" as Language,
    name: "Tamil",
    nativeName: "தமிழ்",
    flag: "🇮🇳",
    sample: "உங்கள் தனிப்பட்ட செலவுகள் மற்றும் பட்ஜெட்டுகளை ₹ ரூபாயில் கண்காணிக்கவும்.",
  },
  {
    code: "hi" as Language,
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    sample: "अपने व्यक्तिगत खर्चों और बजट को ₹ रुपये में आसानी से ट्रैक करें।",
  },
];

export default function LanguageWelcomeModal() {
  const { language, setLanguage, hasSelectedLanguage, confirmLanguageSelection, t } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<Language>(language);

  // If already confirmed language previously, do not show
  if (hasSelectedLanguage) {
    return null;
  }

  const handleSelect = (code: Language) => {
    setSelectedLang(code);
    setLanguage(code); // Update instant preview
  };

  const handleConfirm = () => {
    confirmLanguageSelection(selectedLang);
  };

  const currentDetails = LANGUAGE_DETAILS.find((l) => l.code === selectedLang) || LANGUAGE_DETAILS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 p-6 sm:p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md text-white shadow-md mb-4 border border-white/20">
            <Globe className="h-7 w-7" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur mb-2 border border-white/25">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t("welcomeModal.badge", `Welcome to ${APP_NAME}`)}</span>
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {t("welcomeModal.title", "Choose Your Preferred Language")}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-indigo-100 max-w-md mx-auto leading-relaxed">
            {t("welcomeModal.subtitle", "Select the language you want to use. You can change this anytime from Settings.")}
          </p>
        </div>

        {/* Language Selection Cards */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="space-y-3">
            {LANGUAGE_DETAILS.map((item) => {
              const isSelected = selectedLang === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                  }`}
                >
                  <span className="text-3xl flex-shrink-0 mt-0.5">{item.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-slate-900">{item.nativeName}</span>
                      <span className="text-xs font-medium text-slate-400">({item.name})</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.sample}</p>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center border mt-1 transition ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Confirm Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition"
            >
              <span>
                {t("welcomeModal.continueBtn", "Continue in")} {currentDetails.nativeName}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-3">
              {t("welcomeModal.note", "Your preference will be remembered across sessions.")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
