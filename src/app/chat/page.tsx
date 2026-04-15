"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { MessageSquare, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getDocument, getUserDocuments, DocumentRecord } from "@/lib/firestore";
import ChatInterface from "@/components/ChatInterface";
import AppShell from "@/components/AppShell";
import Link from "next/link";

function ChatContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const docId = searchParams.get("doc");
  const initialQ = searchParams.get("q");

  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [userDocs, setUserDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadDocs = async () => {
      try {
        const docs = await getUserDocuments(user.uid);
        setUserDocs(docs);
        if (docId) {
          const doc = docs.find((d) => d.id === docId) || await getDocument(docId);
          setSelectedDoc(doc);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    loadDocs();
  }, [user, docId]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-saathi-800 flex items-center gap-2">
          <MessageSquare className="w-6 h-6" /> {t("chatWithSaathi")}
        </h1>
        <p className="text-stone-500 text-sm mt-1">Ask questions in any language</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto">
          <div className="card p-4">
            <h3 className="font-semibold text-stone-700 mb-3 text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> Select Document
            </h3>
            {loading ? (
              <div className="flex items-center gap-2 text-stone-400 text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : userDocs.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-stone-500 text-sm mb-2">No documents yet</p>
                <Link href="/analyze" className="text-xs text-saathi-600 hover:text-saathi-700 font-medium">Upload a document →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                <button onClick={() => setSelectedDoc(null)} className={`w-full p-3 rounded-xl text-left transition-all text-sm ${!selectedDoc ? "bg-saathi-700 text-white" : "hover:bg-saathi-50 text-stone-700"}`}>
                  <p className="font-medium">General Legal Chat</p>
                  <p className={`text-xs mt-0.5 ${!selectedDoc ? "text-saathi-200" : "text-stone-400"}`}>No document context</p>
                </button>
                {userDocs.map((doc) => (
                  <button key={doc.id} onClick={() => setSelectedDoc(doc)} className={`w-full p-3 rounded-xl text-left transition-all ${selectedDoc?.id === doc.id ? "bg-saathi-700 text-white" : "hover:bg-saathi-50 text-stone-700"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">📄</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{doc.fileName.length > 25 ? doc.fileName.substring(0, 25) + "..." : doc.fileName}</p>
                        {doc.analysis?.riskLevel && (
                          <span className={`text-xs font-medium ${selectedDoc?.id === doc.id ? "text-saathi-200" : doc.analysis.riskLevel === "high" ? "text-red-600" : doc.analysis.riskLevel === "medium" ? "text-amber-600" : "text-green-600"}`}>
                            {doc.analysis.riskLevel === "high" ? "🚨" : doc.analysis.riskLevel === "medium" ? "⚠️" : "✅"} {doc.analysis.riskLevel}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedDoc && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
              <h3 className="font-medium text-stone-700 text-sm mb-2">Active Context</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                {(selectedDoc.analysis?.summary || selectedDoc.extractedText || "Document loaded").substring(0, 200)}...
              </p>
            </motion.div>
          )}
        </div>

        {/* Chat */}
        <div className="lg:col-span-2" style={{ height: "100%" }}>
          <ChatInterface
            documentContext={selectedDoc?.extractedText || (selectedDoc?.analysis ? `Summary: ${selectedDoc.analysis.summary}\n\nKey Clauses: ${selectedDoc.analysis.keyClauses?.join(", ")}` : "")}
            documentId={selectedDoc?.id}
            initialMessage={initialQ || undefined}
          />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]"><Loader2 className="w-8 h-8 animate-spin text-saathi-500" /></div>}>
        <ChatContent />
      </Suspense>
    </AppShell>
  );
}
