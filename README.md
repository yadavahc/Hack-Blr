# Legal Saathi — AI-Powered Legal Assistant for Rural India

> Built for **HackBLR 2024** — Democratizing legal literacy for farmers, shopkeepers, and rural families across India.

**Live Demo:** [https://hack-blr-seven.vercel.app](https://hack-blr-seven.vercel.app)

Legal Saathi bridges the gap between complex legal documents and the millions of Indians who struggle to understand them. Upload any legal document, get instant AI-powered risk analysis, ask questions by voice in your language, receive plain-language explanations, and generate ready-to-use legal forms — all in Kannada, Hindi, Tamil, Telugu, or English.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Gemini AI Integration](#gemini-ai-integration)
- [Sarvam AI Voice Integration](#sarvam-ai-voice-integration)
- [Vapi Voice AI Integration](#vapi-voice-ai-integration)
- [Qdrant Vector Database (RAG)](#qdrant-vector-database-rag)
- [Smart Legal Form Builder](#smart-legal-form-builder)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Routes](#api-routes)
- [Deployment](#deployment)

---

## Features

| Feature | Description |
|---|---|
| **Document Upload** | PDF, DOC, DOCX, images (PNG/JPG), and plain text — up to 10MB |
| **OCR Support** | Tesseract.js extracts text from scanned documents and photos in English, Hindi, and Kannada |
| **AI Risk Analysis** | Gemini 2.5 Flash identifies risky clauses, safe clauses, risk level (low/medium/high), and what happens if you sign or don't |
| **Multilingual** | Full UI and AI responses in Kannada (ಕನ್ನಡ), Hindi (हिंदी), Tamil (தமிழ்), Telugu (తెలుగు), and English |
| **Voice Input (STT)** | Browser Web Speech API for voice input — supports all 5 Indian languages natively in Chrome |
| **Voice Output (TTS)** | Sarvam AI `bulbul:v2` model for natural Indian-language speech output; browser TTS fallback |
| **Voice Assistant** | Floating voice widget — speak → Gemini answers → Sarvam speaks it back, with multi-turn memory |
| **RAG Chat** | Qdrant vector search retrieves the most relevant document chunks to ground AI answers |
| **Legal Form Builder** | Template-based generator for 10 legal document types — no AI, instant PDF download, fully multilingual |
| **Legal Guides** | Step-by-step plain-language guides for home loans, land documents, education loans, and more |
| **Auth & History** | Firebase Authentication + Firestore to save documents and chat history per user |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, TypeScript) |
| **Styling** | Tailwind CSS + Framer Motion |
| **Authentication** | Firebase Auth (email/password) |
| **Database** | Cloud Firestore |
| **AI / LLM** | Google Gemini 2.5 Flash (analysis + chat), gemini-embedding-001 (RAG embeddings) |
| **Voice STT** | Browser Web Speech API (Chrome — supports hi-IN, kn-IN, ta-IN, te-IN, en-IN) |
| **Voice TTS** | Sarvam AI `bulbul:v2` (Indian languages) + browser Web Speech API fallback |
| **Voice AI** | Vapi (`@vapi-ai/web`) |
| **Vector DB** | Qdrant Cloud (semantic document search / RAG) |
| **PDF Generation** | jsPDF (client-side, for Legal Form Builder) |
| **OCR** | Tesseract.js (multi-language OCR) |
| **PDF Parsing** | pdf-parse |
| **Word Parsing** | mammoth |

---

## Architecture

```
User Browser
     │
     ├── Firebase Auth  (client-side login/signup)
     ├── Firestore      (client-side reads/writes — authenticated)
     └── Next.js App
          │
          ├── /api/upload     → Extract text (pdf-parse / mammoth / Tesseract)
          │                     Store embeddings → Qdrant Cloud
          │
          ├── /api/analyze    → Gemini risk analysis → update Firestore
          │
          ├── /api/chat       → Embed question → Qdrant semantic search (RAG)
          │                     → Gemini answer with retrieved context
          │
          ├── /api/tts        → Sarvam AI bulbul:v2 TTS → base64 audio
          │
          └── /api/stt        → Sarvam AI saarika:v1 STT (browser STT used by default)
```

**Key design decision:** Firestore writes happen client-side (where Firebase Auth context exists). The API routes only perform compute-heavy tasks (text extraction, embeddings, LLM calls) so they never need admin credentials.

---

## Gemini AI Integration

[Google Gemini](https://ai.google.dev) is the primary LLM powering all AI features — document analysis, chat, and embeddings.

### Model fallback chain

```ts
const MODELS = [
  { name: "gemini-2.5-flash",      apiVersion: "v1beta" },
  { name: "gemini-2.5-flash-lite", apiVersion: "v1beta" },
  { name: "gemini-2.0-flash",      apiVersion: "v1beta" },
  { name: "gemini-2.0-flash-lite", apiVersion: "v1beta" },
];
```

If a model returns a 429 (quota exhausted) or 404 (unavailable), the app automatically retries the next model in the chain — making it resilient on the free tier.

### Embeddings

RAG embeddings use `gemini-embedding-001` (v1beta), replacing the previous OpenAI `text-embedding-3-small`.

### Configuration

```env
GEMINI_API_KEY=your_gemini_api_key
```

---

## Sarvam AI Voice Integration

[Sarvam AI](https://sarvam.ai) provides **natural Indian-language speech** for TTS output across all 5 supported languages.

### TTS — Text-to-Speech

- **Model:** `bulbul:v2`
- **Speakers:** `anushka` (EN/HI/KN), `kavitha` (TA), `manisha` (TE)
- **Flow:** AI response text → `/api/tts` → Sarvam API → base64 WAV → browser `Audio` playback
- **Fallback:** Browser Web Speech API if Sarvam is unavailable

### STT — Speech-to-Text

- **Primary:** Browser `SpeechRecognition` / `webkitSpeechRecognition` (Chrome supports all 5 language codes natively: `en-IN`, `hi-IN`, `kn-IN`, `ta-IN`, `te-IN`)
- **Server route:** `/api/stt` using Sarvam `saarika:v1` is available but browser STT is used by default (avoids WebM→WAV conversion issues)

### Voice assistant flow

1. User taps the floating mic button.
2. Browser STT captures speech and produces a transcript.
3. Transcript → `/api/chat` → Gemini answer.
4. Answer → `/api/tts` → Sarvam audio plays back.
5. Multi-turn conversation history is maintained in the panel.

### Language support

| Language | BCP-47 Code | Sarvam Speaker |
|---|---|---|
| English | `en-IN` | anushka |
| Hindi | `hi-IN` | anushka |
| Kannada | `kn-IN` | anushka |
| Tamil | `ta-IN` | kavitha |
| Telugu | `te-IN` | manisha |

### Configuration

```env
SARVAM_API_KEY=your_sarvam_api_key
```

---

## Vapi Voice AI Integration

[Vapi](https://vapi.ai) powers real-time voice AI that lets users **speak questions** about their documents and **hear answers** — no typing required, crucial for low-literacy users.

### How it works

1. User clicks the microphone button in the floating `VoiceAssistant` widget.
2. The browser establishes a real-time WebRTC call with Vapi's infrastructure.
3. Vapi transcribes speech → sends it to the LLM with a custom system prompt that includes the document context.
4. The text response is spoken back using TTS voices.
5. The transcript is surfaced in the UI so users can follow along.

### Language support

| Language | Voice |
|---|---|
| English | `en-IN` |
| Hindi | `hi-IN` |
| Kannada | `kn-IN` |
| Tamil | `ta-IN` |
| Telugu | `te-IN` |

### Configuration

```env
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
VAPI_PRIVATE_KEY=your_vapi_private_key
```

The assistant is initialized in [`src/components/VoiceAssistant.tsx`](src/components/VoiceAssistant.tsx) using the `@vapi-ai/web` SDK. The call config injects document context into the system prompt so the assistant has grounding for questions about the uploaded document.

---

## Qdrant Vector Database (RAG)

[Qdrant](https://qdrant.tech) is a high-performance vector database used to implement **Retrieval-Augmented Generation (RAG)** — giving the AI accurate, document-grounded answers instead of hallucinations.

### Cluster

- **Cluster ID:** `bd3b26b1-5767-4676-80ae-26529c205eea`
- **Endpoint:** `https://bd3b26b1-5767-4676-80ae-26529c205eea.eu-west-2-0.aws.cloud.qdrant.io`
- **Collection:** `legal_saathi_docs`
- **Vector size:** `3072` (Google `gemini-embedding-001`)
- **Distance metric:** Cosine similarity

### Upload pipeline

When a document is uploaded (`/api/upload`):

1. Text is extracted from the file (PDF / DOCX / image / TXT).
2. Text is chunked into ~300-word segments with 50-word overlap using `chunkText()`.
3. Up to 20 chunks are embedded via Google `gemini-embedding-001`.
4. Chunks + embeddings are upserted into Qdrant with metadata: `{ documentId, userId, chunkIndex, text, fileName }`.

### RAG chat retrieval

When a user asks a question (`/api/chat`):

1. The question is embedded using the same `gemini-embedding-001` model.
2. Qdrant performs a vector similarity search filtered by `userId` and optionally `documentId`.
3. The top-3 most relevant chunks are prepended to the Gemini context window.
4. Gemini answers with accurate, document-specific information.

```ts
// From src/lib/qdrant.ts
const embedding = await generateEmbedding(question);
const chunks = await searchSimilarChunks(embedding, userId, documentId, 3);
const ragContext = chunks.map(c => c.text).join("\n\n");
// ragContext is passed as part of the Gemini system prompt
```

### Configuration

```env
QDRANT_URL=https://bd3b26b1-5767-4676-80ae-26529c205eea.eu-west-2-0.aws.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=legal_saathi_docs
```

---

## Smart Legal Form Builder

A fully offline, template-based document generator — no AI required, instant results.

### Templates (10 types)

| Category | Templates |
|---|---|
| Property | Land Purchase Agreement, House Rent Agreement, Property Dispute Complaint, Tenant Eviction Notice |
| Finance | Education Loan Application, Loan Repayment Agreement |
| Legal | Police Complaint (FIR), General Affidavit |
| Government | Income Certificate Request, Caste Certificate Application |

### How it works

1. User selects a template from `/forms`.
2. Dynamic form renders required fields (name, address, dates, amounts, etc.).
3. On submit, values are injected into a predefined legal template string.
4. Document is displayed in a preview pane — download as **PDF** (jsPDF) or **Print**.

### Multilingual

All template titles, descriptions, category headers, and field labels are translated into all 5 languages (EN / HI / KN / TA / TE). The generated document itself is always in English (legal standard), but the form UI adapts to the selected language.

---

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project (Firestore + Auth enabled)
- Google Gemini API key (free tier works)
- Sarvam AI API key (for Indian-language TTS)
- Qdrant Cloud cluster (or local Qdrant instance)

### Installation

```bash
git clone https://github.com/yadavahc/Hack-Blr.git
cd Hack-Blr
npm install
```

### Configure environment

Copy the example below into `.env.local` and fill in your keys:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Gemini AI
GEMINI_API_KEY=

# Sarvam AI (TTS/STT for Indian languages)
SARVAM_API_KEY=

# Vapi
NEXT_PUBLIC_VAPI_PUBLIC_KEY=
VAPI_PRIVATE_KEY=

# Qdrant
QDRANT_URL=
QDRANT_API_KEY=
QDRANT_COLLECTION=legal_saathi_docs

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Deploy Firestore indexes

```bash
npx firebase-tools deploy --only firestore:indexes --project YOUR_PROJECT_ID
```

### Run

```bash
npm run dev
# Open http://localhost:3000
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Yes | Firebase client config (Auth + Firestore) |
| `GEMINI_API_KEY` | Yes | Gemini 2.5 Flash for analysis/chat, gemini-embedding-001 for RAG |
| `SARVAM_API_KEY` | Yes | Sarvam bulbul:v2 TTS for Indian-language voice output |
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | Yes | Vapi public key for browser-side voice calls |
| `VAPI_PRIVATE_KEY` | Yes | Vapi private key for server-side operations |
| `QDRANT_URL` | Yes | Qdrant cluster HTTP endpoint |
| `QDRANT_API_KEY` | Yes | Qdrant API key |
| `QDRANT_COLLECTION` | No | Collection name (default: `legal_saathi_docs`) |
| `NEXT_PUBLIC_APP_URL` | No | App base URL |

> Without `SARVAM_API_KEY`, the app falls back to browser Web Speech API for TTS. Without `GEMINI_API_KEY`, AI features will not function.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Login page
│   │   └── signup/         # Signup page
│   ├── analyze/            # Document upload + risk analysis
│   ├── chat/               # Standalone chat page
│   ├── dashboard/          # User document history
│   ├── forms/              # Smart Legal Form Builder
│   ├── guide/              # Legal guides
│   └── api/
│       ├── upload/         # Text extraction + Qdrant embedding
│       ├── analyze/        # Gemini document analysis
│       ├── chat/           # RAG chat with Qdrant + Gemini
│       ├── tts/            # Sarvam AI TTS → base64 audio
│       └── stt/            # Sarvam AI STT (server-side, optional)
├── components/
│   ├── DocumentUpload.tsx  # Dropzone + Firestore save (client-side)
│   ├── RiskAnalysis.tsx    # Analysis results display
│   ├── ChatInterface.tsx   # Text chat UI with voice input/output
│   ├── VoiceAssistant.tsx  # Floating voice widget (STT → Gemini → Sarvam TTS)
│   ├── AppShell.tsx        # Authenticated layout shell
│   └── Navbar.tsx
├── lib/
│   ├── firebase.ts         # Firebase client init
│   ├── firestore.ts        # Firestore CRUD helpers
│   ├── gemini.ts           # Gemini LLM + embeddings (with model fallback chain)
│   ├── sarvam.ts           # Sarvam AI TTS/STT helpers
│   ├── legalTemplates.ts   # 10 legal form templates + multilingual labels
│   ├── translations.ts     # i18n strings (en / hi / kn / ta / te)
│   ├── useTTS.ts           # React hook for TTS playback
│   └── qdrant.ts           # Qdrant vector store helpers
└── context/
    ├── AuthContext.tsx     # Firebase Auth state
    └── LanguageContext.tsx # i18n context (en / hi / kn / ta / te)
```

---

## API Routes

### `POST /api/upload`

Extracts text from uploaded files and stores embeddings in Qdrant.

**Request:** `multipart/form-data` — `file`, `userId`, `documentId`

**Response:**
```json
{
  "success": true,
  "documentId": "abc123",
  "text": "extracted document text...",
  "textLength": 4200
}
```

### `POST /api/analyze`

Runs Gemini risk analysis on extracted document text.

**Request:** `{ text, language, userId, documentId }`

**Response:** Full `DocumentAnalysis` object with `summary`, `keyClauses`, `riskLevel`, `riskyPoints`, `safePoints`, `ifYouSign`, `ifYouDontSign`, `recommendations`, `simplifiedExplanation`.

### `POST /api/chat`

Answers user questions using RAG (Qdrant) + Gemini.

**Request:** `{ question, context, history, language, userId, documentId }`

**Response:** `{ answer: "..." }`

### `POST /api/tts`

Converts text to speech using Sarvam AI.

**Request:** `{ text, language }` — language is `en | hi | kn | ta | te`

**Response:** `{ audio: "data:audio/wav;base64,...", provider: "sarvam" }` or `{ audio: null, provider: "browser" }` if Sarvam is unavailable.

---

## Deployment

The app is built with Next.js and can be deployed to **Vercel** (recommended):

```bash
npx vercel --prod
```

Set all environment variables in the Vercel dashboard. The Firestore indexes are pre-deployed via `firestore.indexes.json`.

---

## License

MIT — Built with love for rural India at HackBLR 2024.
