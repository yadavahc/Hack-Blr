"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Mic, MicOff, RefreshCw, Sparkles, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { saveChatMessage } from "@/lib/firestore";
import toast from "react-hot-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  documentContext?: string;
  documentId?: string;
  initialMessage?: string;
}

const SUGGESTED_QUESTIONS = {
  en: ["Is this document safe to sign?", "What are the main risks?", "Explain in simple words", "What happens if I don't sign?"],
  hi: ["क्या यह दस्तावेज़ सुरक्षित है?", "मुख्य जोखिम क्या हैं?", "सरल शब्दों में समझाएं", "अगर मैं हस्ताक्षर न करूँ?"],
  kn: ["ಈ ದಾಖಲೆ ಸುರಕ್ಷಿತವೇ?", "ಮುಖ್ಯ ಅಪಾಯಗಳೇನು?", "ಸರಳ ಭಾಷೆಯಲ್ಲಿ ವಿವರಿಸಿ", "ಸಹಿ ಮಾಡದಿದ್ದರೆ?"],
  ta: ["இந்த ஆவணம் கையொப்பமிட பாதுகாப்பானதா?", "முக்கிய அபாயங்கள் என்ன?", "எளிய வார்த்தைகளில் விளக்குங்கள்", "நான் கையொப்பமிடவில்லை என்றால்?"],
  te: ["ఈ పత్రం సంతకం చేయడం సురక్షితమేనా?", "ప్రధాన నష్టాలు ఏమిటి?", "సరళమైన మాటల్లో వివరించండి", "నేను సంతకం చేయకపోతే ఏమవుతుంది?"],
};

// BCP-47 codes Chrome SpeechRecognition accepts for each language
const LANG_CODE: Record<string, string> = {
  en: "en-IN", hi: "hi-IN", kn: "kn-IN", ta: "ta-IN", te: "te-IN",
};

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, "").replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1").replace(/`(.*?)`/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1").replace(/^\s*[-*+]\s/gm, "")
    .replace(/^\s*\d+\.\s/gm, "").trim();
}

export default function ChatInterface({ documentContext, documentId, initialMessage }: ChatInterfaceProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const welcomeMsg = () => ({
    id: "welcome",
    role: "assistant" as const,
    content:
      language === "hi" ? "नमस्ते! मैं लीगल साथी हूँ। अपने क़ानूनी दस्तावेज़ के बारे में कुछ भी पूछें!"
      : language === "kn" ? "ನಮಸ್ಕಾರ! ನಾನು ಲೀಗಲ್ ಸಾಥಿ. ನಿಮ್ಮ ಕಾನೂನು ದಾಖಲೆ ಬಗ್ಗೆ ಯಾವ ಪ್ರಶ್ನೆ ಬೇಕಾದರೂ ಕೇಳಿ!"
      : language === "ta" ? "வணக்கம்! நான் லீகல் சாத்தி. உங்கள் சட்ட ஆவணம் பற்றி எதையும் கேளுங்கள்!"
      : language === "te" ? "నమస్కారం! నేను లీగల్ సాథి. మీ చట్టపరమైన పత్రం గురించి ఏదైనా అడగండి!"
      : "Hello! I'm Legal Saathi, your legal assistant. Ask me anything about your document!",
    timestamp: new Date(),
  });

  const [messages, setMessages] = useState<Message[]>([welcomeMsg()]);
  const [input, setInput] = useState(initialMessage || "");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);

  const recognitionRef = useRef<unknown>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = SUGGESTED_QUESTIONS[language as keyof typeof SUGGESTED_QUESTIONS] || SUGGESTED_QUESTIONS.en;

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (initialMessage) setInput(initialMessage); }, [initialMessage]);

  useEffect(() => {
    setMessages((prev) => prev[0]?.id === "welcome" ? [welcomeMsg(), ...prev.slice(1)] : prev);
    stopSpeaking();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // ── TTS via Sarvam ──────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
  }, []);

  const speak = useCallback(async (text: string, id: string) => {
    stopSpeaking();
    if (speakingId === id) return;
    setSpeakingId(id);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: stripMarkdown(text), language }),
      });
      const data = await res.json();
      if (data.audio && data.provider === "sarvam") {
        const audio = new Audio(data.audio);
        audioRef.current = audio;
        audio.onended = () => { setSpeakingId(null); audioRef.current = null; };
        audio.onerror = () => { setSpeakingId(null); audioRef.current = null; };
        await audio.play();
      } else {
        // Browser TTS fallback
        if (!window.speechSynthesis) { setSpeakingId(null); return; }
        const utterance = new SpeechSynthesisUtterance(stripMarkdown(text));
        utterance.lang = LANG_CODE[language] || "en-IN";
        utterance.rate = 0.9;
        utterance.onend = () => setSpeakingId(null);
        utterance.onerror = () => setSpeakingId(null);
        window.speechSynthesis.speak(utterance);
      }
    } catch { setSpeakingId(null); }
  }, [language, speakingId, stopSpeaking]);

  // ── STT via browser SpeechRecognition (Chrome supports hi/kn/ta/te) ──
  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error(t("voiceNotSupported"));
      return;
    }
    stopSpeaking();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SR() as any;
    recognition.lang = LANG_CODE[language] || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: { results: SpeechRecognitionResultList }) => {
      const transcript = Array.from(event.results).map((r) => r[0].transcript).join("");
      setInput(transcript);
      if (event.results[event.results.length - 1].isFinal && transcript.trim()) {
        setIsListening(false);
        sendMessage(transcript.trim());
        setInput("");
      }
    };

    recognition.onerror = (e: { error: string }) => {
      setIsListening(false);
      if (e.error !== "no-speech") toast.error("Voice input failed. Please try again.");
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, stopSpeaking]);

  const stopListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (recognitionRef.current as any)?.stop();
    setIsListening(false);
  }, []);

  // ── Send message ───────────────────────────────────────
  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: content.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    stopSpeaking();

    if (user) saveChatMessage({ userId: user.uid, documentId, role: "user", content: content.trim(), language }).catch(console.error);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: content.trim(),
          context: documentContext || "",
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          language, userId: user?.uid, documentId,
        }),
      });
      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: data.answer, timestamp: new Date() };
      setMessages((prev) => [...prev, assistantMessage]);

      if (autoSpeak) setTimeout(() => speak(data.answer, assistantMessage.id), 300);
      if (user) saveChatMessage({ userId: user.uid, documentId, role: "assistant", content: data.answer, language }).catch(console.error);
    } catch (err) {
      console.error(err);
      toast.error("Failed to get response");
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(), role: "assistant", timestamp: new Date(),
        content:
          language === "hi" ? "माफ़ करें, मैं आपका प्रश्न नहीं समझ सका। कृपया फिर से प्रयास करें।"
          : language === "kn" ? "ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
          : language === "ta" ? "மன்னிக்கவும், உங்கள் கேள்வியை புரிந்துகொள்ள முடியவில்லை. மீண்டும் முயற்சிக்கவும்."
          : language === "te" ? "క్షమించండి, మీ ప్రశ్నను అర్థం చేసుకోలేకపోయాను. దయచేసి మళ్ళీ ప్రయత్నించండి."
          : "Sorry, I couldn't process your question. Please try again.",
      }]);
    } finally { setLoading(false); }
  };

  const clearChat = () => { stopSpeaking(); stopListening(); setMessages([welcomeMsg()]); };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-saathi-100 shadow-saathi overflow-hidden">
      {/* Header */}
      <div className="bg-saathi-700 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-saathi-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-saathi-200" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{t("chatWithSaathi")}</p>
            <p className="text-xs text-saathi-300">AI Legal Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAutoSpeak((v) => !v)}
            title={t("autoSpeak")}
            className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${autoSpeak ? "bg-saathi-500 text-white" : "text-saathi-300 hover:text-white hover:bg-saathi-600"}`}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline text-xs">{t("autoSpeak")}</span>
          </button>
          <button onClick={clearChat} className="p-1.5 text-saathi-300 hover:text-white hover:bg-saathi-600 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-cream-50" style={{ minHeight: 0 }}>
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${message.role === "assistant" ? "bg-saathi-700" : "bg-saathi-200"}`}>
                {message.role === "assistant" ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-saathi-700" />}
              </div>
              <div className={`max-w-[80%] ${message.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  message.role === "user" ? "bg-saathi-700 text-white rounded-tr-sm" : "bg-white border border-saathi-100 text-stone-800 rounded-tl-sm shadow-sm"
                }`}>
                  {message.role === "assistant"
                    ? <ReactMarkdown className="prose prose-sm prose-stone max-w-none prose-p:my-0.5 prose-li:my-0">{message.content}</ReactMarkdown>
                    : message.content}
                </div>
                <div className={`flex items-center gap-2 mt-1 px-1 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                  <span className="text-xs text-stone-400">{message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  {message.role === "assistant" && (
                    <button
                      onClick={() => speakingId === message.id ? stopSpeaking() : speak(message.content, message.id)}
                      className={`p-1 rounded-md transition-colors ${speakingId === message.id ? "text-saathi-600 bg-saathi-100" : "text-stone-300 hover:text-saathi-500"}`}
                    >
                      {speakingId === message.id
                        ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}><Volume2 className="w-3.5 h-3.5" /></motion.div>
                        : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-saathi-700 flex items-center justify-center"><Bot className="w-4 h-4 text-white" /></div>
              <div className="bg-white border border-saathi-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map((i) => <motion.div key={i} className="w-2 h-2 bg-saathi-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {messages.length <= 2 && !loading && (
        <div className="px-4 py-2 border-t border-saathi-50 bg-cream-50">
          <p className="text-xs text-stone-400 mb-2">{t("suggestedQuestions")}</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((q) => (
              <button key={q} onClick={() => sendMessage(q)} className="px-3 py-1.5 bg-saathi-50 hover:bg-saathi-100 text-saathi-700 text-xs rounded-full border border-saathi-200 transition-colors">{q}</button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-saathi-100 bg-white">
        <AnimatePresence>
          {isListening && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="mb-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <motion.div className="w-2.5 h-2.5 bg-red-500 rounded-full" animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }} />
              <span className="text-xs font-medium text-red-700 flex-1">{t("recording")}</span>
              <div className="flex gap-0.5 items-center h-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div key={i} className="w-0.5 bg-red-400 rounded-full" animate={{ height: [4, 12, 4] }} transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder={isListening ? t("recording") : t("typeMessage")}
            rows={1}
            disabled={isListening}
            className="flex-1 resize-none rounded-xl border border-saathi-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-saathi-500 focus:ring-1 focus:ring-saathi-500 bg-cream-50 text-stone-800 placeholder-stone-400 max-h-32 disabled:opacity-60"
            style={{ minHeight: "42px" }}
          />
          <button type="button" onClick={isListening ? stopListening : startListening} disabled={loading}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
              isListening ? "bg-red-500 hover:bg-red-600 text-white shadow-lg" : "bg-saathi-100 hover:bg-saathi-200 text-saathi-700 disabled:opacity-50"
            }`}>
            {isListening ? (
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.8, repeat: Infinity }}><MicOff className="w-4 h-4" /></motion.div>
            ) : <Mic className="w-4 h-4" />}
          </button>
          <button type="submit" disabled={!input.trim() || loading || isListening}
            className="w-10 h-10 bg-saathi-700 text-white rounded-xl flex items-center justify-center hover:bg-saathi-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        <p className="text-xs text-stone-400 mt-1.5 text-center">{t("pressEnterHint")}</p>
      </div>
    </div>
  );
}
