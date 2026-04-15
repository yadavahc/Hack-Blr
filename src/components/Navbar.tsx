"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, LayoutDashboard, FileSearch, MessageSquare, BookOpen, LogOut, Menu, X, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, logOut } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/analyze", label: t("analyzeDocument"), icon: FileSearch },
    { href: "/chat", label: t("chatWithSaathi"), icon: MessageSquare },
    { href: "/guide", label: t("guides"), icon: BookOpen },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-cream-100/95 backdrop-blur-md border-b border-saathi-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-saathi-700 rounded-xl flex items-center justify-center group-hover:bg-saathi-600 transition-colors shadow-saathi">
              <Scale className="w-5 h-5 text-saathi-100" />
            </div>
            <div>
              <span className="font-bold text-saathi-800 text-lg leading-none block">
                {t("appName")}
              </span>
              <span className="text-xs text-saathi-500 leading-none">{t("appTagline")}</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    pathname === href
                      ? "bg-saathi-700 text-white shadow-sm"
                      : "text-saathi-700 hover:bg-saathi-100 hover:text-saathi-800"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-2">
            <LanguageSelector />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-saathi-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-saathi-200 rounded-full flex items-center justify-center">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <User className="w-4 h-4 text-saathi-700" />
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-saathi-700 max-w-24 truncate">
                    {user.displayName || user.email?.split("@")[0]}
                  </span>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-saathi-lg border border-saathi-100 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-saathi-100">
                        <p className="text-sm font-medium text-saathi-800 truncate">
                          {user.displayName || "User"}
                        </p>
                        <p className="text-xs text-saathi-500 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { logOut(); setProfileOpen(false); }}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t("logout")}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-saathi-700 hover:text-saathi-900 transition-colors"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium bg-saathi-700 text-white rounded-lg hover:bg-saathi-600 transition-colors shadow-sm"
                >
                  {t("signup")}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            {user && (
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-saathi-700 hover:bg-saathi-100 transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && user && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-saathi-200 bg-cream-100 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    pathname === href
                      ? "bg-saathi-700 text-white"
                      : "text-saathi-700 hover:bg-saathi-100"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
