"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Image, X, CheckCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { formatFileSize } from "@/lib/utils";
import toast from "react-hot-toast";

interface UploadedFile {
  file: File;
  preview?: string;
  status: "pending" | "uploading" | "done" | "error";
}

interface DocumentUploadProps {
  onUploadComplete: (data: { text: string; fileName: string; fileType: string; documentId?: string }) => void;
  userId: string;
}

export default function DocumentUpload({ onUploadComplete, userId }: DocumentUploadProps) {
  const { t } = useLanguage();
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [processing, setProcessing] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;

      setUploadedFile({ file, preview, status: "pending" });
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: () => toast.error("File too large or unsupported format"),
  });

  const handleUpload = async () => {
    if (!uploadedFile) return;
    setProcessing(true);
    setUploadedFile((prev) => prev ? { ...prev, status: "uploading" } : null);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile.file);
      formData.append("userId", userId);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      setUploadedFile((prev) => prev ? { ...prev, status: "done" } : null);
      toast.success("Document uploaded successfully!");
      onUploadComplete({
        text: data.text,
        fileName: uploadedFile.file.name,
        fileType: uploadedFile.file.type,
        documentId: data.documentId,
      });
    } catch (err) {
      console.error(err);
      setUploadedFile((prev) => prev ? { ...prev, status: "error" } : null);
      toast.error("Upload failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const removeFile = () => {
    if (uploadedFile?.preview) URL.revokeObjectURL(uploadedFile.preview);
    setUploadedFile(null);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-8 h-8 text-saathi-500" />;
    return <FileText className="w-8 h-8 text-saathi-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-saathi-500 bg-saathi-50 scale-[1.01]"
            : uploadedFile
            ? "border-saathi-300 bg-saathi-50/50"
            : "border-saathi-300 hover:border-saathi-500 hover:bg-saathi-50/50"
        }`}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {!uploadedFile ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <motion.div
                animate={isDragActive ? { scale: 1.2, rotate: -5 } : { scale: 1, rotate: 0 }}
                className="w-16 h-16 bg-saathi-100 rounded-2xl flex items-center justify-center mx-auto"
              >
                <Upload className={`w-8 h-8 ${isDragActive ? "text-saathi-600" : "text-saathi-400"}`} />
              </motion.div>

              <div>
                <p className="text-lg font-semibold text-saathi-800">
                  {isDragActive ? "Drop your document here" : t("uploadDocument")}
                </p>
                <p className="text-sm text-saathi-500 mt-1 whitespace-pre-line">{t("uploadHint")}</p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {["PDF", "DOC", "DOCX", "JPG", "PNG"].map((ext) => (
                  <span key={ext} className="px-2 py-0.5 bg-saathi-100 text-saathi-600 rounded text-xs font-medium">
                    {ext}
                  </span>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-4"
            >
              {/* Preview */}
              {uploadedFile.preview ? (
                <img
                  src={uploadedFile.preview}
                  alt=""
                  className="w-16 h-16 object-cover rounded-xl border border-saathi-200"
                />
              ) : (
                <div className="w-16 h-16 bg-saathi-100 rounded-xl flex items-center justify-center">
                  {getFileIcon(uploadedFile.file.type)}
                </div>
              )}

              <div className="flex-1 text-left">
                <p className="font-semibold text-saathi-800 truncate">{uploadedFile.file.name}</p>
                <p className="text-sm text-saathi-500">{formatFileSize(uploadedFile.file.size)}</p>
                <div className="mt-1">
                  {uploadedFile.status === "done" ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Uploaded
                    </span>
                  ) : uploadedFile.status === "uploading" ? (
                    <span className="flex items-center gap-1 text-xs text-saathi-600 font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                    </span>
                  ) : uploadedFile.status === "error" ? (
                    <span className="text-xs text-red-600 font-medium">Upload failed</span>
                  ) : (
                    <span className="text-xs text-saathi-500">Ready to upload</span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); removeFile(); }}
                className="p-1.5 text-saathi-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Button */}
      {uploadedFile && uploadedFile.status !== "done" && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleUpload}
          disabled={processing}
          className="w-full py-3.5 bg-saathi-700 text-white rounded-xl font-semibold text-sm hover:bg-saathi-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-saathi"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              {t("uploadDocument")} & {t("analyzeDocument")}
            </>
          )}
        </motion.button>
      )}
    </div>
  );
}
