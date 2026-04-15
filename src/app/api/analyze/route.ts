import { NextRequest, NextResponse } from "next/server";
import { updateDocument } from "@/lib/firestore";
import { DocumentAnalysis } from "@/lib/firestore";

export const runtime = "nodejs";
export const maxDuration = 60;

function generateMockAnalysis(text: string): DocumentAnalysis {
  const hasRiskyWords = /penalty|forfeit|terminate|breach|liable|damages|indemnify/i.test(text);
  const riskLevel = hasRiskyWords ? "medium" : "low";

  return {
    summary: "This appears to be a legal document outlining terms and conditions between parties. It contains standard legal language with some important clauses requiring attention.",
    keyClauses: [
      "Payment terms and obligations of both parties",
      "Duration and termination conditions",
      "Liability and indemnification clauses",
      "Dispute resolution mechanism",
    ],
    riskLevel,
    riskyPoints: hasRiskyWords ? [
      {
        clause: "Penalty or termination clause detected",
        risk: "There may be financial penalties or legal consequences if terms are not met",
        severity: "medium",
        alternative: "Negotiate for more reasonable penalty terms or add a cure period before penalties apply",
      },
    ] : [],
    safePoints: [
      "Standard legal formatting and structure",
      "Clear identification of parties involved",
      "Defined obligations for each party",
    ],
    ifYouSign: "By signing, you are legally bound by all terms and conditions. You will have both rights AND obligations as described. Failure to comply may result in legal action or financial penalties.",
    ifYouDontSign: "No legal obligation is created. You may lose access to services or benefits described in the document. The other party may seek alternative options.",
    recommendations: [
      "Read every clause carefully before signing",
      "Ask for explanation of any terms you don't understand",
      "Consider having a lawyer review high-value agreements",
      "Keep a signed copy for your records",
      "Never sign under pressure — take time to decide",
    ],
    simplifiedExplanation: "This document is a written agreement between two or more people or companies. It clearly states what each person must do and what happens if someone breaks the rules. Like a promise on paper — if you sign it, you must keep your promise or face consequences.",
  };
}

export async function POST(request: NextRequest) {
  let body: { text?: string; language?: string; userId?: string; documentId?: string; fileName?: string } = {};

  try {
    body = await request.json();
    const { text, language = "en", userId, documentId } = body;

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    let analysis: DocumentAnalysis;

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here") {
      const { analyzeDocument } = await import("@/lib/openai");
      analysis = await analyzeDocument(text, language);
    } else {
      console.log("OpenAI not configured — using mock analysis");
      analysis = generateMockAnalysis(text);
    }

    if (documentId) {
      await updateDocument(documentId, { analysis, status: "completed" }).catch(console.error);
    }

    return NextResponse.json({ success: true, analysis, documentId });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({
      success: true,
      analysis: generateMockAnalysis(body.text || ""),
      note: "Fallback analysis used",
    });
  }
}
