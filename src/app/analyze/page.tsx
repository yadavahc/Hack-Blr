"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileSearch, Loader2, RefreshCw, MessageSquare, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getDocument, DocumentRecord } from "@/lib/firestore";
import DocumentUpload from "@/components/DocumentUpload";
import RiskAnalysis from "@/components/RiskAnalysis";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import toast from "react-hot-toast";

function AnalyzeContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const docId = searchParams.get("doc");

  const [currentDoc, setCurrentDoc] = useState<DocumentRecord | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [docText, setDocText] = useState("");
  const [documentId, setDocumentId] = useState<string | undefined>();
  const [loadingExisting, setLoadingExisting] = useState(!!docId);

  useEffect(() => {
    if (docId && user) {
      getDocument(docId)
        .then((doc) => { if (doc) { setCurrentDoc(doc); setDocText(doc.extractedText || ""); setDocumentId(doc.id); } })
        .catch(console.error)
        .finally(() => setLoadingExisting(false));
    }
  }, [docId, user]);

  const handleUploadComplete = async ({ text, fileName, fileType, documentId: dId }: {
    text: string; fileName: string; fileType: string; documentId?: string;
  }) => {
    setDocText(text); setDocumentId(dId); setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: "en", userId: user?.uid, documentId: dId, fileName, fileType }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setCurrentDoc({ userId: user?.uid || "", fileName, fileType, fileSize: 0, extractedText: text, analysis: data.analysis, language: "en", status: "completed" });
      toast.success("Analysis complete!");
    } catch (err) {
      console.error(err);
      toast.error("Analysis failed. Please try again.");
    } finally { setAnalyzing(false); }
  };

  if (loadingExisting) return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center">
      <Loader2 className="w-10 h-10 animate-spin text-saathi-500 mx-auto mb-3" />
      <p className="text-stone-500">Loading document...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-saathi-800 flex items-center gap-2">
              <FileSearch className="w-6 h-6" /> {t("analyzeDocument")}
            </h1>
            <p className="text-stone-500 text-sm mt-1">Upload any legal document for instant AI analysis</p>
          </div>
          {currentDoc && (
            <button onClick={() => { setCurrentDoc(null); setDocText(""); setDocumentId(undefined); }}
              className="flex items-center gap-2 text-sm text-saathi-600 hover:text-saathi-800 transition-colors">
              <RefreshCw className="w-4 h-4" /> New Analysis
            </button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left */}
        <div>
          <AnimatePresence mode="wait">
            {!currentDoc && !analyzing ? (
              <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="card p-6">
                  <h2 className="font-semibold text-stone-800 mb-4">Upload Document</h2>
                  <DocumentUpload onUploadComplete={handleUploadComplete} userId={user?.uid || ""} />
                </div>
                <div className="mt-4 card p-4">
                  <h3 className="font-medium text-stone-700 mb-3 text-sm">Tips for best results:</h3>
                  <div className="space-y-2">
                    {["Upload clear PDF or image files", "For scanned docs, ensure good lighting", "Supports: rent agreements, loan papers, land documents", "Max 10MB per file"].map((tip, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-saathi-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-stone-500">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : analyzing ? (
              <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="card p-12 text-center">
                <div className="relative mx-auto w-20 h-20 mb-6">
                  <motion.div className="absolute inset-0 rounded-full border-4 border-saathi-200" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
                  <motion.div className="absolute inset-0 rounded-full border-4 border-transparent border-t-saathi-600" animate={{ rotate: -360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileSearch className="w-8 h-8 text-saathi-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-saathi-800 mb-2">{t("analyzing")}</p>
                <p className="text-stone-500 text-sm">AI is reading and analyzing your document...</p>
                <div className="mt-6 space-y-2">
                  {["Extracting text...", "Identifying clauses...", "Analyzing risks...", "Generating summary..."].map((step, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.8 }} className="flex items-center gap-2 text-sm text-stone-500">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.8 }} className="w-2 h-2 bg-saathi-500 rounded-full" />
                      {step}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : currentDoc ? (
              <motion.div key="info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-saathi-100 rounded-xl flex items-center justify-center text-xl">📄</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800 truncate">{currentDoc.fileName}</p>
                    <p className="text-xs text-stone-500">{t("analysisComplete")}</p>
                  </div>
                </div>
                {docText && (
                  <div className="card p-4">
                    <h3 className="font-medium text-stone-700 mb-2 text-sm">Extracted Text (Preview)</h3>
                    <div className="bg-cream-100 rounded-xl p-3 max-h-48 overflow-y-auto">
                      <p className="text-xs text-stone-600 leading-relaxed font-mono">{docText.substring(0, 800)}{docText.length > 800 && "..."}</p>
                    </div>
                  </div>
                )}
                <Link href={`/chat?doc=${documentId}`} className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-500 transition-colors shadow-sm">
                  <MessageSquare className="w-4 h-4" /> Ask Questions About This Document
                </Link>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Right: Analysis */}
        <div>
          {currentDoc?.analysis ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <RiskAnalysis analysis={currentDoc.analysis} />
            </motion.div>
          ) : (
            <div className="card p-8 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 bg-saathi-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileSearch className="w-8 h-8 text-saathi-400" />
              </div>
              <p className="font-semibold text-stone-600 mb-1">Analysis will appear here</p>
              <p className="text-stone-400 text-sm">Upload a document to see risk analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]"><Loader2 className="w-8 h-8 animate-spin text-saathi-500" /></div>}>
        <AnalyzeContent />
      </Suspense>
    </AppShell>
  );
}
