"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "./Navbar";
import VoiceAssistant from "./VoiceAssistant";

interface AppShellProps {
  children: React.ReactNode;
  documentContext?: string;
}

export default function AppShell({ children, documentContext }: AppShellProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-saathi-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-saathi-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-saathi-600 text-sm font-medium">Loading Legal Saathi...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-saathi-50">
      <Navbar />
      <main>{children}</main>
      <VoiceAssistant documentContext={documentContext} />
    </div>
  );
}
