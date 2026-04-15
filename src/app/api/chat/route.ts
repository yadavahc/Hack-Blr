import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const LEGAL_RESPONSES: Record<string, string> = {
  safe: "Based on the document I analyzed, this appears to be a relatively standard clause. However, always read carefully and ensure you understand all obligations before signing.",
  risk: "I noticed some concerning language in this document. Clauses with terms like 'penalty', 'forfeit', or 'terminate' can have significant financial implications. I recommend consulting a lawyer.",
  sign: "Before signing, make sure you: (1) Understand all your obligations, (2) Are aware of penalty clauses, (3) Know how to terminate the agreement, (4) Have a copy for your records.",
  default: "I'm here to help you understand your legal document. Could you share what specific part you'd like me to explain? I can help with clauses, obligations, risks, or the overall meaning.",
};

function generateMockResponse(question: string, context: string, language: string): string {
  const q = question.toLowerCase();

  let response = LEGAL_RESPONSES.default;

  if (q.includes("safe") || q.includes("risk") || q.includes("ಅಪಾಯ") || q.includes("जोखिम")) {
    response = context
      ? "Based on the document provided, I've identified some key points to watch. Look for clauses about penalties, automatic renewals, and termination conditions. These are often the riskiest parts of any agreement."
      : LEGAL_RESPONSES.risk;
  } else if (q.includes("sign") || q.includes("ಸಹಿ") || q.includes("हस्ताक्षर")) {
    response = LEGAL_RESPONSES.sign;
  } else if (q.includes("explain") || q.includes("mean") || q.includes("what") || q.includes("ವಿವರ") || q.includes("समझ")) {
    response = context
      ? `This document appears to be a legal agreement. In simple terms: ${context.substring(0, 200)}... The key thing to understand is what you're committing to and what happens if either party doesn't fulfill their obligations.`
      : "Could you share the specific text or clause you'd like me to explain? I'll break it down in simple language.";
  }

  // Language-specific responses
  if (language === "kn") {
    return `ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಧನ್ಯವಾದ. ${response} ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗಾಗಿ ನಿಮ್ಮ ವಕೀಲರನ್ನು ಸಂಪರ್ಕಿಸಿ.`;
  }
  if (language === "hi") {
    return `आपके प्रश्न के लिए धन्यवाद। ${response} अधिक जानकारी के लिए अपने वकील से संपर्क करें।`;
  }
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, context, history = [], language = "en", userId, documentId } = body;

    if (!question) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

    let answer: string;

    // Use OpenAI + RAG if configured
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here") {
      const { chatWithDocument } = await import("@/lib/openai");

      let ragContext = context;

      // Try to get RAG context from Qdrant
      if (userId && process.env.QDRANT_URL) {
        try {
          const { generateEmbedding } = await import("@/lib/openai");
          const { searchSimilarChunks } = await import("@/lib/qdrant");

          const embedding = await generateEmbedding(question);
          const chunks = await searchSimilarChunks(embedding, userId, documentId, 3);

          if (chunks.length > 0) {
            const ragText = chunks.map((c) => c.text).join("\n\n");
            ragContext = `Relevant document context:\n${ragText}\n\n${context}`;
          }
        } catch (ragErr) {
          console.error("RAG retrieval failed (non-fatal):", ragErr);
        }
      }

      answer = await chatWithDocument(question, ragContext, history, language);
    } else {
      // Mock response
      answer = generateMockResponse(question, context, language);
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({
      answer: "I'm sorry, I encountered an error processing your question. Please try again.",
    });
  }
}
