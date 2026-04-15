import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface DocumentRecord {
  id?: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageUrl?: string;
  extractedText?: string;
  analysis?: DocumentAnalysis;
  language: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  status: "uploading" | "processing" | "completed" | "error";
}

export interface DocumentAnalysis {
  summary: string;
  keyClauses: string[];
  riskLevel: "low" | "medium" | "high";
  riskyPoints: RiskPoint[];
  safePoints: string[];
  ifYouSign: string;
  ifYouDontSign: string;
  recommendations: string[];
  simplifiedExplanation: string;
}

export interface RiskPoint {
  clause: string;
  risk: string;
  severity: "low" | "medium" | "high";
  alternative?: string;
}

export interface ChatMessage {
  id?: string;
  userId: string;
  documentId?: string;
  role: "user" | "assistant";
  content: string;
  language: string;
  createdAt?: Timestamp;
}

// Documents
export async function saveDocument(data: Omit<DocumentRecord, "id">) {
  const docRef = await addDoc(collection(db, "documents"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateDocument(id: string, data: Partial<DocumentRecord>) {
  await updateDoc(doc(db, "documents", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getUserDocuments(userId: string): Promise<DocumentRecord[]> {
  const q = query(
    collection(db, "documents"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as DocumentRecord));
}

export async function getDocument(id: string): Promise<DocumentRecord | null> {
  const docSnap = await getDoc(doc(db, "documents", id));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as DocumentRecord;
}

export async function deleteDocument(id: string) {
  await deleteDoc(doc(db, "documents", id));
}

// Chat History
export async function saveChatMessage(data: Omit<ChatMessage, "id">) {
  const docRef = await addDoc(collection(db, "chatMessages"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getChatHistory(userId: string, documentId?: string): Promise<ChatMessage[]> {
  let q;
  if (documentId) {
    q = query(
      collection(db, "chatMessages"),
      where("userId", "==", userId),
      where("documentId", "==", documentId),
      orderBy("createdAt", "asc")
    );
  } else {
    q = query(
      collection(db, "chatMessages"),
      where("userId", "==", userId),
      orderBy("createdAt", "asc")
    );
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
}

// User Preferences
export interface UserPreference {
  userId: string;
  language: string;
  voiceEnabled: boolean;
  lastActive?: Timestamp;
}

export async function saveUserPreference(userId: string, prefs: Partial<UserPreference>) {
  const ref = doc(db, "userPreferences", userId);
  await updateDoc(ref, { ...prefs, lastActive: serverTimestamp() }).catch(async () => {
    await addDoc(collection(db, "userPreferences"), {
      userId,
      ...prefs,
      lastActive: serverTimestamp(),
    });
  });
}

export async function getUserPreference(userId: string): Promise<UserPreference | null> {
  const docSnap = await getDoc(doc(db, "userPreferences", userId));
  if (!docSnap.exists()) return null;
  return docSnap.data() as UserPreference;
}
