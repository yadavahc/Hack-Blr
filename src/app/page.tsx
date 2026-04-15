"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Scale, Mic, Globe2, ShieldCheck, Brain, ArrowRight,
  FileSearch, MessageSquare, Users, Star, CheckCircle2,
  BookOpen, Sparkles, ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import Navbar from "@/components/Navbar";
import LanguageSelector from "@/components/LanguageSelector";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
  }),
};

const features = [
  {
    icon: Mic,
    color: "bg-amber-100 text-amber-700",
    title: "Voice-First AI",
    desc: "Speak naturally in your language. Legal Saathi listens, understands, and responds in Kannada, Hindi, or English.",
  },
  {
    icon: ShieldCheck,
    color: "bg-green-100 text-green-700",
    title: "Risk Analysis",
    desc: "Instantly see risky clauses highlighted in red. Understand what happens if you sign — or if you don't.",
  },
  {
    icon: Globe2,
    color: "bg-blue-100 text-blue-700",
    title: "Multilingual",
    desc: "Full support for ಕನ್ನಡ (Kannada), हिंदी (Hindi), and English. Switch languages anytime.",
  },
  {
    icon: Brain,
    color: "bg-purple-100 text-purple-700",
    title: "AI Memory (RAG)",
    desc: "Uses Qdrant vector search to remember and retrieve relevant legal context from your documents.",
  },
  {
    icon: FileSearch,
    color: "bg-saathi-100 text-saathi-700",
    title: "Smart OCR",
    desc: "Upload photos of documents. AI extracts and analyzes text from handwritten or printed documents.",
  },
  {
    icon: BookOpen,
    color: "bg-teal-100 text-teal-700",
    title: "Legal Guides",
    desc: "Step-by-step guides for home loans, land documents, education loans, and more.",
  },
];

const testimonials = [
  {
    name: "Ramu Farmer",
    location: "Karnataka",
    text: "Legal Saathi explained my land lease in Kannada. I finally understood what I was signing!",
    stars: 5,
  },
  {
    name: "Priya Shopkeeper",
    location: "Rajasthan",
    text: "The risk analysis showed me 3 risky clauses in my shop rental agreement. Saved me from a bad deal.",
    stars: 5,
  },
  {
    name: "Suresh Kumar",
    location: "Maharashtra",
    text: "Used the home loan guide. Very clear steps. The voice assistant helped my elderly father understand too.",
    stars: 5,
  },
];

const stats = [
  { value: "10,000+", label: "Documents Analyzed" },
  { value: "3", label: "Regional Languages" },
  { value: "95%", label: "User Satisfaction" },
  { value: "Rural", label: "First Focus" },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-saathi-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-3 border-saathi-700 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-saathi-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-cream-100/95 backdrop-blur-md border-b border-saathi-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-saathi-700 rounded-xl flex items-center justify-center shadow-saathi">
                <Scale className="w-5 h-5 text-saathi-100" />
              </div>
              <div>
                <span className="font-bold text-saathi-800 text-lg leading-none block">Legal Saathi</span>
                <span className="text-xs text-saathi-500 leading-none">Your Legal Friend</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <Link href="/login" className="text-sm font-medium text-saathi-700 hover:text-saathi-900 px-3 py-2 transition-colors">
                {t("login")}
              </Link>
              <Link href="/signup" className="btn-primary">
                {t("getStarted")} <ArrowRight className="w-4 h-4 ml-1 inline" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-pattern">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-saathi-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2 bg-saathi-100 border border-saathi-200 px-4 py-2 rounded-full text-sm font-medium text-saathi-700 mb-6"
            >
              <Sparkles className="w-4 h-4 text-saathi-500" />
              AI-Powered Legal Assistant for Rural India
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-saathi-900 leading-tight"
            >
              {t("heroTitle")}
              <span className="block text-saathi-600 mt-1">in Your Language</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="mt-5 text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed"
            >
              {t("heroSubtitle")}. Voice support in <strong>ಕನ್ನಡ</strong>, <strong>हिंदी</strong>, and English.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/signup"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-saathi-700 text-white rounded-2xl font-bold text-base hover:bg-saathi-600 transition-all shadow-saathi-lg hover:shadow-xl active:scale-95"
              >
                <Scale className="w-5 h-5" />
                {t("getStarted")} — It's Free
              </Link>
              <Link
                href="#features"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-saathi-700 rounded-2xl font-bold text-base border-2 border-saathi-200 hover:border-saathi-400 hover:bg-saathi-50 transition-all"
              >
                {t("learnMore")} <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Language Pills */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              {[
                { lang: "🇮🇳 ಕನ್ನಡ", label: "Kannada" },
                { lang: "🇮🇳 हिंदी", label: "Hindi" },
                { lang: "🇬🇧 English", label: "English" },
              ].map(({ lang, label }) => (
                <span key={label} className="px-4 py-2 bg-white border border-saathi-200 rounded-full text-sm font-medium text-saathi-700 shadow-sm">
                  {lang}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Hero Image / Demo Card */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
            className="mt-16 max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-3xl shadow-saathi-lg border border-saathi-200 overflow-hidden">
              {/* Mock Browser Bar */}
              <div className="bg-saathi-100 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <div className="w-3 h-3 bg-amber-400 rounded-full" />
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                </div>
                <div className="flex-1 mx-4 bg-white rounded-lg px-3 py-1.5 text-xs text-stone-400">
                  legal-saathi.app
                </div>
              </div>

              {/* Mock Content */}
              <div className="p-6 bg-cream-50">
                <div className="flex gap-4">
                  {/* Left: Upload Area */}
                  <div className="w-1/2 bg-white rounded-2xl p-4 border-2 border-dashed border-saathi-300">
                    <div className="text-center py-4">
                      <div className="text-3xl mb-2">📄</div>
                      <p className="text-sm font-medium text-saathi-700">Land_Agreement.pdf</p>
                      <p className="text-xs text-saathi-500 mt-1">2.3 MB • Uploaded</p>
                      <div className="mt-3 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full inline-block">
                        ✅ Analysis Complete
                      </div>
                    </div>
                  </div>

                  {/* Right: Analysis Preview */}
                  <div className="w-1/2 space-y-3">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-xs font-bold text-red-700 mb-1">🚨 High Risk Clause</p>
                      <p className="text-xs text-red-600">Penalty clause: ₹50,000 if vacated before 1 year</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                      <p className="text-xs font-bold text-green-700 mb-1">✅ Safe</p>
                      <p className="text-xs text-green-600">Security deposit refund within 30 days</p>
                    </div>
                    <div className="bg-saathi-50 border border-saathi-200 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <Mic className="w-3.5 h-3.5 text-saathi-600" />
                        <p className="text-xs text-saathi-600">Ask in Kannada...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-saathi-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="text-center"
              >
                <p className="text-3xl font-extrabold text-white">{stat.value}</p>
                <p className="text-saathi-300 text-sm mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="section-title">{t("features")}</h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            Everything you need to understand and navigate legal documents with confidence
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              className="card p-6 hover:shadow-saathi-lg transition-all group"
            >
              <div className={`w-12 h-12 ${feature.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-800 mb-2 text-lg">{feature.title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-saathi-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Simple 3 steps to understand any legal document</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "📤",
                title: "Upload Document",
                desc: "Upload any legal document — PDF, photo, or scanned image. Our OCR extracts the text.",
              },
              {
                step: "02",
                icon: "🧠",
                title: "AI Analysis",
                desc: "AI analyzes risks, explains clauses, and tells you what happens if you sign or don't sign.",
              },
              {
                step: "03",
                icon: "🎙️",
                title: "Voice Q&A",
                desc: "Ask questions by voice or text in your language. Get simple, clear answers instantly.",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="relative"
              >
                <div className="card p-6 text-center">
                  <div className="text-5xl mb-4">{step.icon}</div>
                  <div className="absolute top-4 right-4 text-6xl font-black text-saathi-100 leading-none select-none">
                    {step.step}
                  </div>
                  <h3 className="font-bold text-stone-800 mb-2 text-lg">{step.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-8 h-8 text-saathi-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="section-title">What People Say</h2>
          <p className="section-subtitle">Trusted by farmers, shopkeepers, and rural families across India</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              className="card p-6"
            >
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-stone-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-saathi-200 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-saathi-600" />
                </div>
                <div>
                  <p className="font-semibold text-stone-800 text-sm">{t.name}</p>
                  <p className="text-xs text-stone-500">{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-saathi-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Stop Being Confused by Legal Documents
            </h2>
            <p className="text-saathi-200 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of rural users who now understand their rights with Legal Saathi
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-10 py-4 bg-white text-saathi-700 rounded-2xl font-bold text-lg hover:bg-saathi-50 transition-all shadow-saathi-lg"
            >
              <Scale className="w-5 h-5" />
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-saathi-300 text-sm mt-4">No credit card needed • Free to use</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-saathi-900 text-saathi-300 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-saathi-700 rounded-xl flex items-center justify-center">
                <Scale className="w-4 h-4 text-saathi-200" />
              </div>
              <span className="font-bold text-saathi-100">Legal Saathi</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              {["Privacy Policy", "Terms of Service", "Contact"].map((item) => (
                <a key={item} href="#" className="hover:text-saathi-100 transition-colors">{item}</a>
              ))}
            </div>
            <p className="text-sm">Built with ❤️ for rural India • HackBLR 2024</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
