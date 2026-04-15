import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Legal Saathi - Your Legal Friend",
  description:
    "Voice-first AI legal assistant that helps rural users understand legal documents in their language",
  keywords: "legal, AI, multilingual, rural India, document analysis, Kannada, Hindi",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚖️</text></svg>",
  },
  openGraph: {
    title: "Legal Saathi - Your Legal Friend",
    description: "AI-powered legal document analysis with voice support in Kannada, Hindi & English",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <AuthProvider>
          <LanguageProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: "#FDF6EC",
                  border: "1px solid #E8C99A",
                  color: "#3D1E0E",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "500",
                },
                success: {
                  iconTheme: { primary: "#C26820", secondary: "#FDF6EC" },
                },
                error: {
                  iconTheme: { primary: "#DC2626", secondary: "#FEF2F2" },
                },
              }}
            />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
