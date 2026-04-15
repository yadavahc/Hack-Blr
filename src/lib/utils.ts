import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDate(timestamp: { seconds: number } | Date | string): string {
  let date: Date;
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === "string") {
    date = new Date(timestamp);
  } else if (timestamp && "seconds" in timestamp) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    return "Unknown date";
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getRiskColor(level: "low" | "medium" | "high"): string {
  switch (level) {
    case "low":
      return "text-green-700 bg-green-50 border-green-200";
    case "medium":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "high":
      return "text-red-700 bg-red-50 border-red-200";
  }
}

export function getRiskBadgeColor(level: "low" | "medium" | "high"): string {
  switch (level) {
    case "low":
      return "bg-green-100 text-green-800";
    case "medium":
      return "bg-amber-100 text-amber-800";
    case "high":
      return "bg-red-100 text-red-800";
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function getFileIcon(fileType: string): string {
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("word") || fileType.includes("doc")) return "📝";
  if (fileType.includes("image")) return "🖼️";
  if (fileType.includes("text")) return "📃";
  return "📋";
}
