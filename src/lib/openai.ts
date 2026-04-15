import OpenAI from "openai";
import { DocumentAnalysis } from "./firestore";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeDocument(
  text: string,
  language: string = "en"
): Promise<DocumentAnalysis> {
  const langInstruction =
    language === "kn"
      ? "Respond in Kannada language."
      : language === "hi"
      ? "Respond in Hindi language."
      : "Respond in English language.";

  const prompt = `You are a legal expert helping rural and low-literacy users in India understand legal documents.

${langInstruction}

Analyze the following legal document and provide a structured JSON response with these exact fields:

{
  "summary": "A simple 2-3 sentence explanation a farmer or rural person can understand",
  "keyClauses": ["List of 3-5 key clauses in simple language"],
  "riskLevel": "low|medium|high",
  "riskyPoints": [
    {
      "clause": "The clause text",
      "risk": "What risk this poses",
      "severity": "low|medium|high",
      "alternative": "A safer alternative clause suggestion"
    }
  ],
  "safePoints": ["List of safe/favorable points"],
  "ifYouSign": "Clear explanation of consequences if signed",
  "ifYouDontSign": "Clear explanation of consequences if NOT signed",
  "recommendations": ["Actionable recommendations"],
  "simplifiedExplanation": "Extremely simple explanation suitable for a person with basic literacy"
}

Document text:
${text.substring(0, 4000)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return result as DocumentAnalysis;
}

export async function chatWithDocument(
  question: string,
  context: string,
  history: { role: "user" | "assistant"; content: string }[],
  language: string = "en"
): Promise<string> {
  const langInstruction =
    language === "kn"
      ? "Always respond in Kannada."
      : language === "hi"
      ? "Always respond in Hindi."
      : "Respond in simple English.";

  const systemPrompt = `You are "Legal Saathi", a helpful legal assistant for rural and low-literacy users in India.
${langInstruction}

Your role:
- Explain legal concepts in very simple terms
- Use analogies from daily life (farming, markets, etc.)
- Be empathetic and supportive
- Warn about risks clearly
- Suggest when to consult a lawyer

Document context:
${context.substring(0, 3000)}`;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.slice(-8),
    { role: "user" as const, content: question },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.5,
    max_tokens: 500,
  });

  return response.choices[0].message.content || "I could not understand your question. Please try again.";
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  const langMap: Record<string, string> = {
    kn: "Kannada",
    hi: "Hindi",
    en: "English",
  };
  const lang = langMap[targetLanguage] || "English";

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Translate the following text to ${lang}. Keep legal terms accurate but explanation simple:\n\n${text}`,
      },
    ],
    temperature: 0.2,
  });

  return response.choices[0].message.content || text;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.substring(0, 8000),
  });
  return response.data[0].embedding;
}

export default openai;
