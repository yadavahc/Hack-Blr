"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Mic, RefreshCw, Sparkles } from "lucide-react";
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
  en: [
    "Is this document safe to sign?",
    "What are the main risks?",
    "Explain in simple words",
    "What happens if I don't sign?",
  ],
  hi: [
    "क्या यह दस्तावेज़ सुरक्षित है?",
    "मुख्य जोखिम क्या हैं?",
    "सरल शब्दों में समझाएं",
    "अगर मैं हस्ताक्षर न करूँ?",
  ],
  kn: [
    "ಈ ದಾಖಲೆ ಸುರಕ್ಷಿತವೇ?",
    "ಮುಖ್ಯ ಅಪಾಯಗಳೇನು?",
    "ಸರಳ ಭಾಷೆಯಲ್ಲಿ ವಿವರಿಸಿ",
    "ಸಹಿ ಮಾಡದಿದ್ದರೆ?",
  ],
};

export default function ChatInterface({ documentContext, documentId, initialMessage }: ChatInterfaceProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: language === "kn"
        ? "ನಮಸ್ಕಾರ! ನಾನು ಲೀಗಲ್ ಸಾಥಿ. ನಿಮ್ಮ ಕಾನೂನು ದಾಖಲೆ ಬಗ್ಗೆ ಯಾವ ಪ್ರಶ್ನೆ ಬೇಕಾದರೂ ಕೇಳಿ!"
        : language === "hi"
        ? "नमस्ते! मैं लीगल साथी हूँ। अपने क़ानूनी दस्तावेज़ के बारे में कुछ भी पूछें!"
        : "Hello! I'm Legal Saathi, your legal assistant. Ask me anything about your document!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState(initialMessage || "");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = SUGGESTED_QUESTIONS[language] || SUGGESTED_QUESTIONS.en;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (initialMessage) {
      setInput(initialMessage);
    }
  }, [initialMessage]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Save to Firebase
    if (user) {
      saveChatMessage({
        userId: user.uid,
        documentId,
        role: "user",
        content: content.trim(),
        language,
      }).catch(console.error);
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: content.trim(),
          context: documentContext || "",
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          language,
          userId: user?.uid,
          documentId,
        }),
      });

      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (user) {
        saveChatMessage({
          userId: user.uid,
          documentId,
          role: "assistant",
          content: data.answer,
          language,
        }).catch(console.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to get response");
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I couldn't process your question. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: language === "kn"
        ? "ನಮಸ್ಕಾರ! ನಾನು ಲೀಗಲ್ ಸಾಥಿ. ನಿಮ್ಮ ಕಾನೂನು ದಾಖಲೆ ಬಗ್ಗೆ ಯಾವ ಪ್ರಶ್ನೆ ಬೇಕಾದರೂ ಕೇಳಿ!"
        : language === "hi"
        ? "नमस्ते! मैं लीगल साथी हूँ। कुछ भी पूछें!"
        : "Hello! I'm Legal Saathi. How can I help you?",
      timestamp: new Date(),
    }]);
  };

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
        <button onClick={clearChat} className="p-1.5 text-saathi-300 hover:text-white hover:bg-saathi-600 rounded-lg transition-colors" title="Clear chat">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-cream-50" style={{ minHeight: 0 }}>
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                message.role === "assistant" ? "bg-saathi-700" : "bg-saathi-200"
              }`}>
                {message.role === "assistant" ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-saathi-700" />
                )}
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] ${message.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-saathi-700 text-white rounded-tr-sm"
                    : "bg-white border border-saathi-100 text-stone-800 rounded-tl-sm shadow-sm"
                }`}>
                  {message.role === "assistant" ? (
                    <ReactMarkdown className="prose prose-sm prose-stone max-w-none prose-p:my-0.5 prose-li:my-0">
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    message.content
                  )}
                </div>
                <span className="text-xs text-stone-400 mt-1 px-1">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </motion.div>
          ))}

          {/* Loading */}
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-saathi-700 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-saathi-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-saathi-400 rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && !loading && (
        <div className="px-4 py-2 border-t border-saathi-50 bg-cream-50">
          <p className="text-xs text-stone-400 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="px-3 py-1.5 bg-saathi-50 hover:bg-saathi-100 text-saathi-700 text-xs rounded-full border border-saathi-200 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-saathi-100 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("typeMessage")}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-saathi-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-saathi-500 focus:ring-1 focus:ring-saathi-500 bg-cream-50 text-stone-800 placeholder-stone-400 max-h-32"
            style={{ minHeight: "42px" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-saathi-700 text-white rounded-xl flex items-center justify-center hover:bg-saathi-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        <p className="text-xs text-stone-400 mt-1.5 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
