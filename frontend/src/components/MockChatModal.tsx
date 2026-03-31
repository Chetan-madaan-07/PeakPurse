"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";

interface CAProfile {
  id: string;
  full_name: string;
  city: string;
}

interface Message {
  id: number;
  sender: "user" | "ca" | "system";
  text: string;
}

const MOCK_REPLIES = [
  "Hello! I have received your message. Could you provide a bit more detail about your tax situation?",
  "Thanks for reaching out. I'll review your query and get back to you shortly.",
  "Hi there. To assist you better, are you looking for individual filing or business advisory?",
  "Sure, I can help with that. Could you share your approximate annual income range?",
  "Great question! Let me explain the key deductions available under Section 80C for you.",
];

export default function MockChatModal({
  ca,
  onClose,
}: {
  ca: CAProfile;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: "system", text: `This is a secure channel with ${ca.full_name}.` },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    setMessages(prev => [...prev, { id: Date.now(), sender: "user", text: inputValue }]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const reply = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now(), sender: "ca", text: reply }]);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col h-[520px] border border-gray-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {ca.full_name.charAt(3)}
            </div>
            <div>
              <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{ca.full_name}</p>
              <p className="text-xs text-emerald-500 font-semibold">● Online</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : msg.sender === "system" ? "justify-center" : "justify-start"}`}>
              {msg.sender === "system" ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-full">{msg.text}</p>
              ) : (
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${msg.sender === "user"
                    ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-sm"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-bl-sm"
                  }`}>
                  {msg.text}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isTyping}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          />
          <button type="submit" disabled={!inputValue.trim() || isTyping}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white disabled:opacity-50">
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
