"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Lightbulb, FileSignature, FileX,
  Info, TrendingUp
} from "lucide-react";
import { DocumentAnalysis, RiskPoint } from "@/lib/firestore";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface RiskAnalysisProps {
  analysis: DocumentAnalysis;
}

function RiskBadge({ level }: { level: "low" | "medium" | "high" }) {
  const config = {
    low: { cls: "bg-green-100 text-green-800 border-green-200", label: "Low Risk" },
    medium: { cls: "bg-amber-100 text-amber-800 border-amber-200", label: "Medium Risk" },
    high: { cls: "bg-red-100 text-red-800 border-red-200", label: "High Risk" },
  };
  const { cls, label } = config[level];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border", cls)}>
      {level === "low" ? <ShieldCheck className="w-3 h-3" /> :
       level === "medium" ? <AlertTriangle className="w-3 h-3" /> :
       <ShieldAlert className="w-3 h-3" />}
      {label}
    </span>
  );
}

function RiskyClause({ point, index }: { point: RiskPoint; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const severityConfig = {
    low: "border-yellow-200 bg-yellow-50",
    medium: "border-orange-200 bg-orange-50",
    high: "border-red-200 bg-red-50",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn("rounded-xl border p-3.5", severityConfig[point.severity])}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-start justify-between w-full text-left gap-3"
      >
        <div className="flex items-start gap-2.5 flex-1">
          <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
            point.severity === "high" ? "text-red-500" :
            point.severity === "medium" ? "text-orange-500" : "text-yellow-500"
          }`} />
          <div className="flex-1">
            <p className="text-sm font-medium text-stone-800">{point.clause}</p>
            <RiskBadge level={point.severity} />
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-stone-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-stone-200/60 space-y-2">
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Risk Explanation</p>
                <p className="text-sm text-stone-700">{point.risk}</p>
              </div>
              {point.alternative && (
                <div className="bg-green-50 rounded-lg p-2.5 border border-green-200">
                  <p className="text-xs font-semibold text-green-700 mb-0.5 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> Safer Alternative
                  </p>
                  <p className="text-sm text-green-800">{point.alternative}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function RiskAnalysis({ analysis }: RiskAnalysisProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"overview" | "risks" | "decision" | "advice">("overview");

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Info },
    { id: "risks" as const, label: "Risks", icon: AlertTriangle },
    { id: "decision" as const, label: "Decision", icon: TrendingUp },
    { id: "advice" as const, label: "Advice", icon: Lightbulb },
  ];

  return (
    <div className="bg-white rounded-2xl border border-saathi-100 shadow-saathi overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-saathi-700 to-saathi-600 px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-white text-lg">{t("analysisComplete")}</h2>
          <p className="text-saathi-200 text-sm mt-0.5">{t("riskLevel")}</p>
        </div>
        <div className={cn("px-4 py-2 rounded-xl font-bold text-sm border-2", {
          "bg-green-100 text-green-800 border-green-300": analysis.riskLevel === "low",
          "bg-amber-100 text-amber-800 border-amber-300": analysis.riskLevel === "medium",
          "bg-red-100 text-red-800 border-red-300": analysis.riskLevel === "high",
        })}>
          {analysis.riskLevel === "low" ? "✅ " : analysis.riskLevel === "medium" ? "⚠️ " : "🚨 "}
          {t(analysis.riskLevel)}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-saathi-100 bg-cream-100">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs sm:text-sm font-medium transition-all",
              activeTab === id
                ? "text-saathi-800 border-b-2 border-saathi-700 bg-white"
                : "text-saathi-500 hover:text-saathi-700 hover:bg-saathi-50"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Simple Explanation */}
              <div className="bg-saathi-50 rounded-xl p-4 border border-saathi-100">
                <h3 className="font-semibold text-saathi-800 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" /> {t("simplifiedExplanation")}
                </h3>
                <p className="text-saathi-700 text-sm leading-relaxed">{analysis.simplifiedExplanation}</p>
              </div>

              {/* Summary */}
              <div>
                <h3 className="font-semibold text-stone-800 mb-2">{t("summary")}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{analysis.summary}</p>
              </div>

              {/* Key Clauses */}
              {analysis.keyClauses?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-stone-800 mb-3">{t("keyClauses")}</h3>
                  <div className="space-y-2">
                    {analysis.keyClauses.map((clause, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="flex items-start gap-2.5 p-3 bg-stone-50 rounded-lg border border-stone-100"
                      >
                        <span className="w-5 h-5 bg-saathi-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-stone-700">{clause}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safe Points */}
              {analysis.safePoints?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" /> {t("safePoints")}
                  </h3>
                  <div className="space-y-2">
                    {analysis.safePoints.map((point, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 bg-green-50 rounded-lg border border-green-100">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-green-800">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Risks Tab */}
          {activeTab === "risks" && (
            <motion.div key="risks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500" /> {t("riskyPoints")}
                </h3>
                <span className="text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded-full">
                  {analysis.riskyPoints?.length || 0} found
                </span>
              </div>

              {analysis.riskyPoints?.length > 0 ? (
                analysis.riskyPoints.map((point, i) => (
                  <RiskyClause key={i} point={point} index={i} />
                ))
              ) : (
                <div className="text-center py-8">
                  <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <p className="text-stone-600 font-medium">No major risks found</p>
                  <p className="text-stone-400 text-sm">This document appears to be safe</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Decision Tab */}
          {activeTab === "decision" && (
            <motion.div key="decision" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-sm text-stone-500 mb-4">Understand the consequences before making your decision</p>

              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <FileSignature className="w-4 h-4" /> {t("ifYouSign")}
                </h3>
                <p className="text-green-700 text-sm leading-relaxed">{analysis.ifYouSign}</p>
              </div>

              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <FileX className="w-4 h-4" /> {t("ifYouDontSign")}
                </h3>
                <p className="text-red-700 text-sm leading-relaxed">{analysis.ifYouDontSign}</p>
              </div>

              <div className="bg-saathi-50 rounded-xl p-4 border border-saathi-200">
                <p className="text-xs text-saathi-600 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  Always consult a qualified lawyer before signing any legal document.
                </p>
              </div>
            </motion.div>
          )}

          {/* Advice Tab */}
          {activeTab === "advice" && (
            <motion.div key="advice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <h3 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" /> {t("recommendations")}
              </h3>
              {analysis.recommendations?.length > 0 ? (
                analysis.recommendations.map((rec, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-100"
                  >
                    <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-amber-900">{rec}</p>
                  </motion.div>
                ))
              ) : (
                <p className="text-stone-500 text-sm">No specific recommendations at this time.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
