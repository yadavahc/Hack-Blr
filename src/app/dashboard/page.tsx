"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText, Upload, MessageSquare, BookOpen, TrendingUp,
  Shield, Clock, ChevronRight, Trash2, Eye, AlertTriangle,
  ShieldCheck, Loader2, Plus
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getUserDocuments, deleteDocument, DocumentRecord } from "@/lib/firestore";
import { formatFileSize, formatDate, getRiskBadgeColor, getFileIcon, truncateText } from "@/lib/utils";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: "easeOut" },
  }),
};

function DashboardContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getUserDocuments(user.uid)
        .then(setDocuments)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this document?")) return;
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const stats = [
    { label: "Total Documents", value: documents.length, icon: FileText, color: "bg-saathi-100 text-saathi-700" },
    { label: "Analyzed", value: documents.filter((d) => d.status === "completed").length, icon: ShieldCheck, color: "bg-green-100 text-green-700" },
    { label: "High Risk", value: documents.filter((d) => d.analysis?.riskLevel === "high").length, icon: AlertTriangle, color: "bg-red-100 text-red-700" },
    { label: "Processing", value: documents.filter((d) => d.status === "processing").length, icon: Clock, color: "bg-amber-100 text-amber-700" },
  ];

  const quickActions = [
    { href: "/analyze", icon: Upload, label: "Upload & Analyze", desc: "Upload a new document", color: "bg-saathi-700 hover:bg-saathi-600 text-white" },
    { href: "/chat", icon: MessageSquare, label: "Chat with Saathi", desc: "Ask legal questions", color: "bg-amber-600 hover:bg-amber-500 text-white" },
    { href: "/guide", icon: BookOpen, label: "Legal Guides", desc: "Step-by-step guides", color: "bg-teal-600 hover:bg-teal-500 text-white" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-saathi-800">
          {t("hello")}, {user?.displayName?.split(" ")[0] || "Friend"} 👋
        </h1>
        <p className="text-stone-500 mt-1">{t("welcome")}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div key={i} variants={fadeUp} initial="hidden" animate="visible" custom={i} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-stone-800">{stat.value}</p>
                <p className="text-xs text-stone-500 mt-0.5">{stat.label}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4} className="mb-8">
        <h2 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-saathi-600" /> Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <Link key={i} href={action.href} className={`${action.color} rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm`}>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <action.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">{action.label}</p>
                <p className="text-sm opacity-80">{action.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto opacity-70" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Documents */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-stone-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-saathi-600" /> {t("myDocuments")}
          </h2>
          <Link href="/analyze" className="flex items-center gap-1.5 text-sm text-saathi-700 font-medium hover:text-saathi-600 transition-colors">
            <Plus className="w-4 h-4" /> Add New
          </Link>
        </div>

        {loading ? (
          <div className="card p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-saathi-400 mx-auto mb-3" />
            <p className="text-stone-500 text-sm">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-saathi-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-saathi-400" />
            </div>
            <p className="font-semibold text-stone-700 mb-1">{t("noDocuments")}</p>
            <p className="text-stone-500 text-sm mb-5">{t("uploadFirst")}</p>
            <Link href="/analyze" className="btn-primary inline-flex items-center gap-2">
              <Upload className="w-4 h-4" /> {t("uploadDocument")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc, i) => (
              <motion.div key={doc.id} variants={fadeUp} initial="hidden" animate="visible" custom={i} className="card p-4 flex items-center gap-4 hover:shadow-saathi transition-all group">
                <div className="w-12 h-12 bg-saathi-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {getFileIcon(doc.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-stone-800 truncate">{doc.fileName}</p>
                    {doc.analysis?.riskLevel && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRiskBadgeColor(doc.analysis.riskLevel)}`}>
                        {doc.analysis.riskLevel === "high" ? "🚨" : doc.analysis.riskLevel === "medium" ? "⚠️" : "✅"} {doc.analysis.riskLevel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-stone-400">{formatFileSize(doc.fileSize)}</span>
                    {doc.createdAt && <span className="text-xs text-stone-400">{formatDate(doc.createdAt)}</span>}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      doc.status === "completed" ? "bg-green-100 text-green-700" :
                      doc.status === "processing" ? "bg-amber-100 text-amber-700" :
                      doc.status === "error" ? "bg-red-100 text-red-700" : "bg-stone-100 text-stone-600"
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                  {doc.analysis?.summary && (
                    <p className="text-xs text-stone-500 mt-1 line-clamp-1">{truncateText(doc.analysis.summary, 100)}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/analyze?doc=${doc.id}`} className="p-2 text-saathi-600 hover:bg-saathi-100 rounded-lg transition-colors" title="View">
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link href={`/chat?doc=${doc.id}`} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Chat">
                    <MessageSquare className="w-4 h-4" />
                  </Link>
                  <button onClick={(e) => doc.id && handleDelete(doc.id, e)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {documents.some((d) => d.analysis?.riskLevel === "high") && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={6} className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">High-Risk Documents Need Attention</p>
              <p className="text-sm text-red-600 mt-1">
                You have {documents.filter((d) => d.analysis?.riskLevel === "high").length} high-risk document(s). Review before signing.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return <AppShell><DashboardContent /></AppShell>;
}
