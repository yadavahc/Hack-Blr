"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGES, Language } from "@/lib/translations";

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === language);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-saathi-700 hover:bg-saathi-100 transition-colors"
        title={t("selectLanguage")}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{current?.nativeName}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-saathi-lg border border-saathi-100 overflow-hidden z-50"
          >
            <div className="px-3 py-2 border-b border-saathi-100">
              <p className="text-xs font-medium text-saathi-500 uppercase tracking-wide">
                {t("selectLanguage")}
              </p>
            </div>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as Language);
                  setOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm transition-colors ${
                  language === lang.code
                    ? "bg-saathi-50 text-saathi-800 font-medium"
                    : "text-saathi-700 hover:bg-saathi-50"
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <div className="text-left">
                  <p className="font-medium leading-none">{lang.nativeName}</p>
                  <p className="text-xs text-saathi-400 mt-0.5">{lang.name}</p>
                </div>
                {language === lang.code && (
                  <span className="ml-auto w-1.5 h-1.5 bg-saathi-600 rounded-full" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
