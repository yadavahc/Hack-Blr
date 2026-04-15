import { QdrantClient } from "@qdrant/js-client-rest";

const COLLECTION_NAME = process.env.QDRANT_COLLECTION || "legal_saathi_docs";
const VECTOR_SIZE = 1536; // OpenAI text-embedding-3-small

let client: QdrantClient | null = null;

function getClient(): QdrantClient {
  if (!client) {
    client = new QdrantClient({
      url: process.env.QDRANT_URL || "http://localhost:6333",
      apiKey: process.env.QDRANT_API_KEY,
    });
  }
  return client;
}

export async function ensureCollection() {
  const qdrant = getClient();
  try {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);
    if (!exists) {
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      });
    }
  } catch (error) {
    console.error("Qdrant collection error:", error);
  }
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  userId: string;
  chunkIndex: number;
  text: string;
  fileName: string;
  embedding?: number[];
}

export async function storeDocumentChunks(
  chunks: DocumentChunk[],
  embeddings: number[][]
) {
  const qdrant = getClient();
  await ensureCollection();

  const points = chunks.map((chunk, i) => ({
    id: chunk.id,
    vector: embeddings[i],
    payload: {
      documentId: chunk.documentId,
      userId: chunk.userId,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      fileName: chunk.fileName,
    },
  }));

  await qdrant.upsert(COLLECTION_NAME, { points });
}

export async function searchSimilarChunks(
  embedding: number[],
  userId: string,
  documentId?: string,
  topK: number = 5
): Promise<{ text: string; score: number; fileName: string }[]> {
  const qdrant = getClient();

  const filter: Record<string, unknown> = documentId
    ? {
        must: [
          { key: "userId", match: { value: userId } },
          { key: "documentId", match: { value: documentId } },
        ],
      }
    : {
        must: [{ key: "userId", match: { value: userId } }],
      };

  try {
    const results = await qdrant.search(COLLECTION_NAME, {
      vector: embedding,
      filter,
      limit: topK,
      with_payload: true,
    });

    return results.map((r) => ({
      text: r.payload?.text as string,
      score: r.score,
      fileName: r.payload?.fileName as string,
    }));
  } catch (error) {
    console.error("Qdrant search error:", error);
    return [];
  }
}

export async function deleteDocumentChunks(documentId: string) {
  const qdrant = getClient();
  try {
    await qdrant.delete(COLLECTION_NAME, {
      filter: {
        must: [{ key: "documentId", match: { value: documentId } }],
      },
    });
  } catch (error) {
    console.error("Qdrant delete error:", error);
  }
}

export function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim()) chunks.push(chunk);
  }

  return chunks;
}
