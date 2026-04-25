"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Volume2, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";

interface VoiceAssistantProps {
  documentContext?: string;
  onTranscript?: (text: string) => void;
}

type Status = "idle" | "listening" | "processing" | "speaking";

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

export default function VoiceAssistant({ documentContext, onTranscript }: VoiceAssistantProps) {
  const { t, language } = useLanguage();
  const [status, setStatus] = useState<Status>("idle");
  const [isExpanded, setIsExpanded] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);

  const recognitionRef = useRef<unknown>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel();
  }, []);

  const processAndRespond = useCallback(async (userText: string) => {
    setStatus("processing");
    setTranscript(userText);
    onTranscript?.(userText);

    try {
      // Step 1: Gemini chat response
      const newHistory = [...chatHistory, { role: "user" as const, content: userText }];
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userText,
          context: documentContext || "",
          history: chatHistory.slice(-6),
          language,
        }),
      });
      const chatData = await chatRes.json();
      const aiText = chatData.answer || "Sorry, I could not get a response.";
      setResponse(aiText);
      setChatHistory([...newHistory, { role: "assistant", content: aiText }]);

      // Step 2: TTS via Sarvam
      setStatus("speaking");
      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: stripMarkdown(aiText), language }),
      });
      const ttsData = await ttsRes.json();

      if (ttsData.audio && ttsData.provider === "sarvam") {
        const audio = new Audio(ttsData.audio);
        audioRef.current = audio;
        audio.onended = () => { setStatus("idle"); audioRef.current = null; };
        audio.onerror = () => { setStatus("idle"); audioRef.current = null; };
        await audio.play();
      } else {
        // Browser TTS fallback
        const utterance = new SpeechSynthesisUtterance(stripMarkdown(aiText));
        utterance.lang = LANG_CODE[language] || "en-IN";
        utterance.rate = 0.9;
        utterance.onend = () => setStatus("idle");
        utterance.onerror = () => setStatus("idle");
        window.speechSynthesis?.speak(utterance);
      }
    } catch (err) {
      console.error("Voice assistant error:", err);
      toast.error("Could not get a response. Please try again.");
      setStatus("idle");
    }
  }, [language, documentContext, chatHistory, onTranscript]);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input not supported in this browser. Please use Chrome.");
      return;
    }
    stopAudio();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SR() as any;
    recognition.lang = LANG_CODE[language] || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => { setStatus("listening"); setTranscript(""); setResponse(""); };

    recognition.onresult = (event: { results: SpeechRecognitionResultList }) => {
      const text = Array.from(event.results).map((r) => r[0].transcript).join("");
      setTranscript(text);
      if (event.results[event.results.length - 1].isFinal && text.trim()) {
        recognition.stop();
        processAndRespond(text.trim());
      }
    };

    recognition.onerror = (e: { error: string }) => {
      setStatus("idle");
      if (e.error !== "no-speech") toast.error("Could not hear you. Please try again.");
    };

    recognition.onend = () => { if (status === "listening") setStatus("idle"); };

    recognition.start();
    recognitionRef.current = recognition;
  }, [language, stopAudio, processAndRespond, status]);

  const stopListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (recognitionRef.current as any)?.stop();
    setStatus("idle");
  }, []);

  const handleMicClick = () => {
    if (status === "listening") { stopListening(); }
    else if (status === "speaking") { stopAudio(); setStatus("idle"); }
    else if (status === "idle") { startListening(); }
  };

  const langLabel = (
    { kn: "ಕನ್ನಡ • ಹಿಂದಿ • ತಮಿಳು • ತೆಲುಗು • ಇಂಗ್ಲಿಷ್", hi: "कन्नड़ • हिंदी • तमिल • तेलुगु • अंग्रेज़ी", ta: "கன்னடம் • இந்தி • தமிழ் • தெலுங்கு • ஆங்கிலம்", te: "కన్నడ • హిందీ • తమిళం • తెలుగు • ఇంగ్లీష్", en: "Kannada • Hindi • Tamil • Telugu • English" } as Record<string, string>
  )[language] || "Kannada • Hindi • Tamil • Telugu • English";

  const statusLabel = (
    { idle: t("startVoice"), listening: t("recording"), processing: "Processing...", speaking: t("speaking") } as Record<Status, string>
  )[status];

  const bars = Array.from({ length: 5 }, (_, i) => i);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-saathi-lg flex items-center justify-center transition-all ${
          status === "listening" ? "bg-red-500" : status === "speaking" ? "bg-amber-500" : "bg-saathi-700 hover:bg-saathi-600"
        }`}
      >
        {status === "listening" ? (
          <motion.div className="flex gap-0.5 items-center">
            {bars.map((i) => <motion.div key={i} className="w-0.5 bg-white rounded-full" animate={{ height: [8, 16, 8] }} transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }} />)}
          </motion.div>
        ) : status === "speaking" ? (
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
            <Volume2 className="w-6 h-6 text-white" />
          </motion.div>
        ) : status === "processing" ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </motion.button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 z-50 w-72 bg-white rounded-2xl shadow-saathi-lg border border-saathi-100 overflow-hidden"
          >
            <div className="bg-saathi-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-saathi-200" />
                <span className="font-semibold text-white text-sm">{t("voiceAssistant")}</span>
              </div>
              <button onClick={() => setIsExpanded(false)} className="text-saathi-200 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              {/* Visualizer */}
              <div className="flex items-center justify-center mb-4">
                <div className={`relative w-20 h-20 rounded-full flex items-center justify-center ${
                  status === "listening" ? "bg-red-50" : status === "speaking" ? "bg-amber-50" : "bg-saathi-50"
                }`}>
                  {(status === "listening" || status === "speaking") && (
                    <motion.div
                      className={`absolute inset-0 rounded-full ${status === "listening" ? "bg-red-200" : "bg-amber-200"}`}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  {status === "processing" ? (
                    <Loader2 className="w-10 h-10 text-saathi-600 animate-spin" />
                  ) : status === "listening" ? (
                    <div className="flex gap-1 items-end h-8">
                      {bars.map((i) => <motion.div key={i} className="w-1.5 bg-red-500 rounded-full" animate={{ height: [4, 20, 4] }} transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }} />)}
                    </div>
                  ) : status === "speaking" ? (
                    <div className="flex gap-1 items-end h-8">
                      {bars.map((i) => <motion.div key={i} className="w-1.5 bg-amber-500 rounded-full" animate={{ height: [4, 20, 4] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }} />)}
                    </div>
                  ) : (
                    <Mic className="w-8 h-8 text-saathi-600" />
                  )}
                </div>
              </div>

              <p className="text-center text-sm font-medium text-saathi-700 mb-2">{statusLabel}</p>

              {transcript && (
                <div className="mb-2 p-2 bg-saathi-50 rounded-lg text-xs text-saathi-700 border border-saathi-100">
                  <span className="font-semibold text-saathi-500 block mb-0.5">You:</span>
                  "{transcript}"
                </div>
              )}
              {response && (
                <div className="mb-2 p-2 bg-amber-50 rounded-lg text-xs text-stone-700 border border-amber-100 max-h-24 overflow-y-auto">
                  <span className="font-semibold text-amber-700 block mb-0.5">Saathi:</span>
                  {response.substring(0, 200)}{response.length > 200 && "..."}
                </div>
              )}

              <button
                onClick={handleMicClick}
                disabled={status === "processing"}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                  status === "listening" ? "bg-red-500 hover:bg-red-600 text-white"
                  : status === "speaking" ? "bg-amber-500 hover:bg-amber-600 text-white"
                  : "bg-saathi-700 hover:bg-saathi-600 text-white"
                }`}
              >
                {status === "listening" ? <><MicOff className="w-4 h-4" /> {t("stopVoice")}</>
                : status === "speaking" ? <><Volume2 className="w-4 h-4" /> Stop Speaking</>
                : status === "processing" ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                : <><Mic className="w-4 h-4" /> {t("startVoice")}</>}
              </button>

              <p className="mt-3 text-center text-xs text-saathi-400">{langLabel}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
