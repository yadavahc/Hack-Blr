import { NextRequest, NextResponse } from "next/server";
import { saveDocument, updateDocument } from "@/lib/firestore";
import { generateEmbedding } from "@/lib/openai";
import { storeDocumentChunks, chunkText } from "@/lib/qdrant";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";
export const maxDuration = 60;

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type;

  // PDF extraction
  if (mimeType === "application/pdf") {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      return data.text;
    } catch (err) {
      console.error("PDF parse error:", err);
      return `[PDF: ${file.name}] - Could not extract text. Please use a text-searchable PDF.`;
    }
  }

  // Word documents
  if (mimeType.includes("word") || mimeType.includes("officedocument")) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (err) {
      console.error("DOCX parse error:", err);
      return `[Word Document: ${file.name}]`;
    }
  }

  // Images - OCR with Tesseract
  if (mimeType.startsWith("image/")) {
    try {
      const Tesseract = await import("tesseract.js");
      const worker = await Tesseract.createWorker(["eng", "hin", "kan"]);
      const { data: { text } } = await worker.recognize(buffer);
      await worker.terminate();
      return text;
    } catch (err) {
      console.error("OCR error:", err);
      return `[Image: ${file.name}] - OCR extraction attempted.`;
    }
  }

  // Plain text
  if (mimeType === "text/plain") {
    return buffer.toString("utf-8");
  }

  return `[Document: ${file.name}] - Text extraction not supported for this format.`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing file or userId" }, { status: 400 });
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
    }

    // Save initial document record
    const documentId = await saveDocument({
      userId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      language: "en",
      status: "processing",
    });

    // Extract text
    const extractedText = await extractTextFromFile(file);

    // Store embeddings in Qdrant (if OpenAI key is configured)
    if (process.env.OPENAI_API_KEY && extractedText.length > 50) {
      try {
        const chunks = chunkText(extractedText, 300, 50);
        const embeddings = await Promise.all(
          chunks.slice(0, 20).map((chunk) => generateEmbedding(chunk))
        );

        const docChunks = chunks.slice(0, 20).map((text, i) => ({
          id: uuidv4(),
          documentId,
          userId,
          chunkIndex: i,
          text,
          fileName: file.name,
        }));

        await storeDocumentChunks(docChunks, embeddings);
      } catch (qdrantErr) {
        console.error("Qdrant storage error (non-fatal):", qdrantErr);
      }
    }

    // Update document with extracted text
    await updateDocument(documentId, {
      extractedText,
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      documentId,
      text: extractedText,
      textLength: extractedText.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
