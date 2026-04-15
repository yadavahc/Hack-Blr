"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Volume2, Phone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";

interface VoiceAssistantProps {
  documentContext?: string;
  onTranscript?: (text: string) => void;
}

type CallStatus = "idle" | "connecting" | "active" | "ended";

export default function VoiceAssistant({ documentContext, onTranscript }: VoiceAssistantProps) {
  const { t, language } = useLanguage();
  const [status, setStatus] = useState<CallStatus>("idle");
  const [isExpanded, setIsExpanded] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [vapiInstance, setVapiInstance] = useState<unknown>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);

  const initVapi = useCallback(async () => {
    try {
      const { default: Vapi } = await import("@vapi-ai/web");
      const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
      if (!publicKey) {
        toast.error("Voice assistant not configured");
        return null;
      }
      const vapi = new Vapi(publicKey);

      vapi.on("call-start", () => setStatus("active"));
      vapi.on("call-end", () => { setStatus("ended"); setTimeout(() => setStatus("idle"), 2000); });
      vapi.on("speech-start", () => setIsSpeaking(true));
      vapi.on("speech-end", () => setIsSpeaking(false));
      vapi.on("volume-level", (v: number) => setVolume(v));
      vapi.on("message", (msg: { type: string; role: string; transcript: string }) => {
        if (msg.type === "transcript" && msg.role === "user") {
          setTranscript(msg.transcript);
          onTranscript?.(msg.transcript);
        }
      });
      vapi.on("error", (e: Error) => {
        console.error("Vapi error:", e);
        toast.error("Voice assistant error");
        setStatus("idle");
      });

      setVapiInstance(vapi);
      return vapi;
    } catch (err) {
      console.error("Failed to init Vapi:", err);
      return null;
    }
  }, [onTranscript]);

  const startCall = async () => {
    setStatus("connecting");
    const vapi = vapiInstance || (await initVapi());
    if (!vapi) { setStatus("idle"); return; }

    const langInstructions =
      language === "kn"
        ? "Speak in Kannada language."
        : language === "hi"
        ? "Speak in Hindi language."
        : "Speak in simple English.";

    try {
      await (vapi as {
        start: (config: {
          model: { provider: string; model: string; messages: Array<{role: string; content: string}> };
          voice: { provider: string; voiceId: string };
          firstMessage: string;
        }) => Promise<void>
      }).start({
        model: {
          provider: "openai",
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are Legal Saathi, a helpful legal assistant for rural users in India. ${langInstructions}
              Explain things in very simple terms. Use everyday examples.
              ${documentContext ? `Document context: ${documentContext.substring(0, 1000)}` : ""}
              Keep responses short and clear. Always offer to explain more if needed.`,
            },
          ],
        },
        voice: {
          provider: "11labs",
          voiceId: language === "hi" ? "pNInz6obpgDQGcFmaJgB" : "21m00Tcm4TlvDq8ikWAM",
        },
        firstMessage:
          language === "kn"
            ? "ನಮಸ್ಕಾರ! ನಾನು ಲೀಗಲ್ ಸಾಥಿ. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"
            : language === "hi"
            ? "नमस्ते! मैं लीगल साथी हूँ। आपकी कैसे मदद करूँ?"
            : "Hello! I'm Legal Saathi. How can I help you understand your document today?",
      });
    } catch (err) {
      console.error("Failed to start call:", err);
      toast.error("Could not start voice call");
      setStatus("idle");
    }
  };

  const endCall = async () => {
    if (vapiInstance) {
      await (vapiInstance as { stop: () => Promise<void> }).stop();
    }
    setStatus("ended");
  };

  const bars = Array.from({ length: 5 }, (_, i) => i);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-saathi-lg flex items-center justify-center transition-all ${
          status === "active"
            ? "bg-red-500 hover:bg-red-600"
            : "bg-saathi-700 hover:bg-saathi-600"
        }`}
      >
        {status === "active" ? (
          <motion.div className="flex gap-0.5 items-center">
            {bars.map((i) => (
              <motion.div
                key={i}
                className="w-0.5 bg-white rounded-full"
                animate={{ height: [8, 16 + Math.random() * 12, 8] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </motion.div>
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
            {/* Header */}
            <div className="bg-saathi-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-saathi-200" />
                <span className="font-semibold text-white text-sm">{t("voiceAssistant")}</span>
              </div>
              <button onClick={() => setIsExpanded(false)} className="text-saathi-200 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Status Indicator */}
              <div className="flex items-center justify-center mb-4">
                <div className={`relative w-20 h-20 rounded-full flex items-center justify-center ${
                  status === "active" ? "bg-red-50" : "bg-saathi-50"
                }`}>
                  {status === "active" && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-red-200"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  {status === "connecting" ? (
                    <motion.div
                      className="w-10 h-10 border-3 border-saathi-600 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : status === "active" ? (
                    <div className="flex gap-1 items-end h-8">
                      {bars.map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 bg-red-500 rounded-full"
                          animate={{ height: [4, 20 + volume * 10, 4] }}
                          transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Mic className={`w-8 h-8 ${status === "ended" ? "text-saathi-300" : "text-saathi-600"}`} />
                  )}
                </div>
              </div>

              {/* Status Text */}
              <p className="text-center text-sm font-medium text-saathi-700 mb-1">
                {status === "idle" && t("startVoice")}
                {status === "connecting" && "Connecting..."}
                {status === "active" && (isSpeaking ? t("speaking") : t("listening"))}
                {status === "ended" && "Call ended"}
              </p>

              {/* Transcript */}
              {transcript && (
                <div className="mt-2 p-2 bg-saathi-50 rounded-lg text-xs text-saathi-600">
                  "{transcript}"
                </div>
              )}

              {/* Controls */}
              <div className="mt-4 flex gap-2">
                {status === "idle" || status === "ended" ? (
                  <button
                    onClick={startCall}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-saathi-700 text-white rounded-xl text-sm font-medium hover:bg-saathi-600 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {t("startVoice")}
                  </button>
                ) : (
                  <button
                    onClick={endCall}
                    disabled={status === "connecting"}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <MicOff className="w-4 h-4" />
                    {t("stopVoice")}
                  </button>
                )}
              </div>

              <p className="mt-3 text-center text-xs text-saathi-400">
                {language === "kn" ? "ಕನ್ನಡ, ಹಿಂದಿ, ಇಂಗ್ಲಿಷ್ ಬೆಂಬಲ" :
                 language === "hi" ? "कन्नड़, हिंदी, अंग्रेज़ी" :
                 "Kannada • Hindi • English"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
