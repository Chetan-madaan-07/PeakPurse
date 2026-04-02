"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Send, Trash2, Sparkles, LogIn } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "bot";
  text: string;
}

const SUGGESTED_QUESTIONS = [
  "Am I saving enough?",
  "Can I afford a new car?",
  "How is my Health Score?",
  "What are my top spending categories?",
  "Give me tax saving tips for India.",
  "What is SIP and how does it work?",
];

export default function ChatPage() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "👋 Hi! I'm **PeakBot**, your personal finance assistant. I can answer general finance questions for everyone, and give personalized insights if you're logged in!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    setIsTyping(true);

    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await axios.post(
        "/api/chatbot/message",
        { message: text, session_id: sessionId },
        { headers }
      );

      const { reply, session_id } = res.data;
      if (session_id) setSessionId(session_id);
      setMessages(prev => [...prev, { role: "bot", text: reply }]);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error?.message || "PeakBot is resting. Try again in a minute.";
      setMessages(prev => [...prev, { role: "bot", text: `⚠️ ${errMsg}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = async () => {
    if (sessionId) {
      await axios.delete(`/api/chatbot/session/${sessionId}`).catch(() => {});
    }
    setSessionId(null);
    setMessages([{
      role: "bot",
      text: "👋 Hi! I'm **PeakBot**, your personal finance assistant. I can answer general finance questions for everyone, and give personalized insights if you're logged in!",
    }]);
  };

  const renderText = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 pt-14">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Left Panel ── */}
      <aside className={`
        fixed md:relative z-40 md:z-auto top-14 md:top-auto bottom-0 left-0
        w-64 border-r border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col p-5 gap-5
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>

        {/* Bot Profile */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900">
              <Bot size={32} className="text-white" />
            </div>
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full" />
          </div>
          <div className="text-center">
            <p className="font-extrabold text-gray-800 dark:text-gray-100 text-lg">PeakBot</p>
            <p className="text-xs text-emerald-500 font-semibold uppercase tracking-widest">● Online</p>
          </div>

          {/* Auth status */}
          {user ? (
            <div className="w-full text-center px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ Logged in as {user.name || user.email.split("@")[0]}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Personalized answers enabled</p>
            </div>
          ) : (
            <div className="w-full text-center px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Guest mode</p>
              <p className="text-xs text-gray-400 mt-0.5">General questions only</p>
              <Link href="/login" className="mt-1.5 inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                <LogIn size={11} /> Sign in for more
              </Link>
            </div>
          )}
        </div>

        <hr className="border-gray-100 dark:border-slate-800" />

        {/* Suggested Questions */}
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1">
            <Sparkles size={12} /> Try asking
          </p>
          {SUGGESTED_QUESTIONS.map(q => (
            <button key={q} onClick={() => sendMessage(q)} disabled={isTyping}
              className="text-left text-xs px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-medium border border-transparent hover:border-indigo-100 dark:hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
              {q}
            </button>
          ))}
        </div>

        {/* Clear */}
        <button onClick={handleClear}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-gray-100 dark:border-slate-800">
          <Trash2 size={14} /> Clear Chat
        </button>
      </aside>

      {/* ── Main Chat ── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(p => !p)}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Bot size={18} className="text-indigo-500" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
            <Bot size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">PeakBot</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
              Gemini 1.5 Flash · {user ? "Personalized mode" : "Guest mode — log in for personalized answers"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "bot" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Bot size={13} className="text-white" />
                </div>
              )}
              <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === "user"
                  ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-sm shadow-md"
                  : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-bl-sm shadow-sm border border-gray-100 dark:border-slate-700"
                }`}>
                {renderText(msg.text)}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <Bot size={13} className="text-white" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={user ? "Ask PeakBot about your finances..." : "Ask a general finance question..."}
              disabled={isTyping}
              className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-60"
            />
            <button type="submit" disabled={!input.trim() || isTyping}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <Send size={16} />
            </button>
          </form>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-2 text-center">
            PeakBot provides educational information only. Not financial advice.
          </p>
        </div>
      </main>
    </div>
  );
}
