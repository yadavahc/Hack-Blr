"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Search } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import GuideCard, { Guide } from "@/components/GuideCard";
import AppShell from "@/components/AppShell";

const GUIDES: Guide[] = [
  {
    id: "home-loan", title: "Home Loan Process", titleHi: "गृह ऋण प्रक्रिया", titleKn: "ಗೃಹ ಸಾಲ ಪ್ರಕ್ರಿಯೆ",
    icon: "🏠", description: "Complete guide to applying for a home loan", estimatedTime: "30-60 days", difficulty: "medium",
    steps: [
      { title: "Check Eligibility", description: "Check eligibility based on income, age (21-60), credit score (750+), and employment.", documents: ["Salary slips (3 months)", "Bank statements (6 months)", "Form 16 / IT returns"], warnings: ["Credit score below 700 may get rejected", "Existing EMIs reduce eligibility"] },
      { title: "Compare Banks", description: "Compare interest rates, processing fees from multiple banks. Government banks often offer lower rates.", warnings: ["Never pay advance fees to agents", "Beware of teaser rates that increase later"] },
      { title: "Submit Application", description: "Submit application with all documents. Bank verifies employment and income.", documents: ["Aadhaar Card", "PAN Card", "Photos", "Property documents", "Income proof", "Address proof"], warnings: ["False information = loan cancellation"] },
      { title: "Property Valuation", description: "Bank sends valuer to assess property's market value. Loan is typically 80-90% of valuation." },
      { title: "Legal Verification", description: "Bank's lawyer verifies ownership, title, existing loans.", warnings: ["Encumbered property may cause rejection"] },
      { title: "Loan Sanction", description: "Approved? You receive sanction letter. Read all terms — rate, EMI, prepayment charges.", documents: ["Sanction letter", "Loan agreement"], warnings: ["Never sign blank documents"] },
      { title: "Disbursement", description: "After signing, funds go to seller. Keep EMI schedule ready.", warnings: ["Verify disbursement amount matches agreed sum"] },
    ],
  },
  {
    id: "rental", title: "Rental Agreement", titleHi: "किराया समझौता", titleKn: "ಬಾಡಿಗೆ ಒಪ್ಪಂದ",
    icon: "🏘️", description: "Understanding and negotiating your rental agreement", estimatedTime: "1-7 days", difficulty: "easy",
    steps: [
      { title: "Know Your Rights", description: "Landlord cannot enter without notice, cut utilities, or evict without legal process.", warnings: ["Do not accept verbal agreements", "Get everything in writing"] },
      { title: "Check Key Clauses", description: "Review: rent, deposit, lock-in period, maintenance, termination notice.", warnings: ["Lock-in means you cannot vacate before that period"] },
      { title: "Negotiate Terms", description: "Negotiate rent amount, annual increment %, deposit, and maintenance duties." },
      { title: "Register Agreement", description: "Agreements above 11 months MUST be registered at Sub-Registrar office.", documents: ["Stamped agreement", "Aadhaar/PAN both parties", "Photos", "Property ownership"], warnings: ["Unregistered agreements have limited legal protection"] },
    ],
  },
  {
    id: "land-sale", title: "Land Purchase / Sale Deed", titleHi: "ज़मीन की खरीद", titleKn: "ಭೂಮಿ ಖರೀದಿ",
    icon: "🌾", description: "Safe process for buying or selling land", estimatedTime: "30-90 days", difficulty: "hard",
    steps: [
      { title: "Verify Ownership", description: "Check title deed — should show continuous ownership. Visit Sub-Registrar or Tehsildar.", documents: ["Title deed", "Encumbrance Certificate (EC)", "RTC"], warnings: ["Never buy without EC — shows existing loans"] },
      { title: "Check Land Type", description: "Agricultural land has special rules. Non-farmers may not buy in many states." },
      { title: "Agree on Price", description: "All payments by bank transfer. Avoid cash.", warnings: ["Cash payments can cause legal trouble"] },
      { title: "Sale Agreement", description: "Sign Sale Agreement first. Pay advance (10%). This is legally binding.", documents: ["Sale Agreement on stamp paper", "PAN both parties"], warnings: ["Advance forfeited if sale falls through due to your fault"] },
      { title: "Sale Deed Registration", description: "Execute and register Sale Deed at Sub-Registrar. Both parties present.", documents: ["Sale Deed", "ID proof both", "Photos", "Two witnesses with ID"], warnings: ["Stamp duty is mandatory — varies by state"] },
      { title: "Mutation", description: "After registration, get land mutated to your name in revenue records.", warnings: ["Mutation mandatory for future sale"] },
    ],
  },
  {
    id: "education-loan", title: "Education Loan Guide", titleHi: "शिक्षा ऋण गाइड", titleKn: "ಶಿಕ್ಷಣ ಸಾಲ",
    icon: "🎓", description: "How to get an education loan for higher studies", estimatedTime: "2-4 weeks", difficulty: "easy",
    steps: [
      { title: "Check Eligibility", description: "Need admission letter from recognized institution. Co-applicant (parent) income proof needed.", documents: ["Admission letter", "Fee structure", "Co-applicant income proof"] },
      { title: "Loan Amount", description: "Up to ₹7.5L without collateral. Above needs security. Repayment starts 1 year after course.", warnings: ["Interest accrues during moratorium — pay at least interest during studies"] },
      { title: "Apply Under Schemes", description: "Check Vidya Lakshmi portal, PM Vidhya Laxmi, and state government scholarships." },
      { title: "Submit Documents", description: "Apply at bank branch or online.", documents: ["Mark sheets", "Admission letter", "Fee structure", "KYC docs", "Co-applicant income proof"] },
      { title: "Repayment Planning", description: "Section 80E gives tax deduction on interest. Plan repayment from day one.", warnings: ["Defaulting on education loan ruins credit history permanently"] },
    ],
  },
  {
    id: "employment", title: "Employment Contract", titleHi: "रोज़गार अनुबंध", titleKn: "ಉದ್ಯೋಗ ಒಪ್ಪಂದ",
    icon: "💼", description: "What to check before signing your job offer", estimatedTime: "1-3 days", difficulty: "easy",
    steps: [
      { title: "CTC vs In-hand Salary", description: "CTC includes PF, gratuity, bonuses. In-hand is less. Calculate exactly.", warnings: ["Negotiate on fixed pay, not CTC"] },
      { title: "Notice Period", description: "Usually 30-90 days. Long periods can trap you.", warnings: ["3-month notice can be difficult", "Check if notice can be bought out"] },
      { title: "Non-Compete Clause", description: "Prevents joining competitors for 1-2 years. Often not legally enforceable.", warnings: ["Can restrict your career — get legal advice if too restrictive"] },
      { title: "Intellectual Property", description: "Check if your work/code belongs to employer.", warnings: ["Side projects may be claimed if mentioned in contract"] },
      { title: "Probation Terms", description: "Usually 3-6 months. Either party can terminate with shorter notice during this period." },
    ],
  },
];

function GuideContent() {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");

  const filtered = GUIDES.filter((g) => !search || g.title.toLowerCase().includes(search.toLowerCase()) || g.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-saathi-800 flex items-center gap-2">
          <BookOpen className="w-6 h-6" /> {t("documentGuides")}
        </h1>
        <p className="text-stone-500 text-sm mt-1">Step-by-step guides for common legal processes in India</p>
      </motion.div>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guides..." className="input-field pl-10" />
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <BookOpen className="w-10 h-10 text-saathi-300 mx-auto mb-3" />
            <p className="text-stone-500">No guides found for "{search}"</p>
          </div>
        ) : (
          filtered.map((guide, i) => (
            <motion.div key={guide.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <GuideCard guide={guide} language={language} />
            </motion.div>
          ))
        )}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 bg-saathi-50 border border-saathi-200 rounded-2xl p-5">
        <p className="text-sm text-saathi-700">
          💡 <strong>Need personalized help?</strong> Upload your specific document for AI analysis, or ask our voice assistant in your language.
        </p>
      </motion.div>
    </div>
  );
}

export default function GuidePage() {
  return <AppShell><GuideContent /></AppShell>;
}
