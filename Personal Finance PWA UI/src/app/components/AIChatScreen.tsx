import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, BrainCircuit } from "lucide-react";
import { db, Transaction, Goal } from "../lib/db";
import { chatWithAI } from "../lib/ai";
import { format } from "date-fns";

interface Message {
  id: number;
  role: "user" | "ai" | "assistant";
  text: string;
  time: string;
}

export function AIChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [questionsLeft, setQuestionsLeft] = useState(5);
  const [isTyping, setIsTyping] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      const [txs, gls, history, context] = await Promise.all([
        db.getTransactions(),
        db.getGoals(),
        db.getChatHistory(),
        db.getAIContext()
      ]);
      setTransactions(txs);
      setGoals(gls);
      
      const today = format(new Date(), "yyyy-MM-dd");
      if (context.lastChatDate === today) {
        setQuestionsLeft(Math.max(0, 5 - context.dailyChatCount));
      } else {
        setQuestionsLeft(5);
        await db.updateAIContext({ ...context, dailyChatCount: 0, lastChatDate: today });
      }

      if (history.length === 0) {
        setMessages([{
          id: Date.now(),
          role: "ai",
          text: "Bonjour ! Je suis votre assistant financier IA. Posez-moi une question sur votre budget, vos d\u00e9penses, ou vos objectifs d'\u00e9pargne.",
          time: format(new Date(), "HH:mm"),
        }]);
      } else {
        setMessages(history.map(h => ({
          id: h.id!,
          role: h.role === "assistant" ? "ai" : "user",
          text: h.content,
          time: format(new Date(h.date), "HH:mm")
        })));
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const send = async (text: string) => {
    if (!text.trim() || questionsLeft <= 0 || isTyping) return;
    
    const now = new Date();
    const timeStr = format(now, "HH:mm");
    
    const userMsg: Message = { id: Date.now(), role: "user", text: text.trim(), time: timeStr };
    setMessages((prev) => [...prev, userMsg]);
    await db.addChatMessage({ role: "user", content: text.trim(), date: now.toISOString() });
    
    setInput("");
    setIsTyping(true);

    try {
      const response = await chatWithAI(text.trim(), transactions, goals, messages.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })));
      const aiMsg: Message = { id: Date.now() + 1, role: "ai", text: response, time: format(new Date(), "HH:mm") };
      
      setMessages((prev) => [...prev, aiMsg]);
      await db.addChatMessage({ role: "assistant", content: response, date: new Date().toISOString() });
      
      const context = await db.getAIContext();
      const newCount = (context.dailyChatCount || 0) + 1;
      await db.updateAIContext({ ...context, dailyChatCount: newCount, lastChatDate: format(new Date(), "yyyy-MM-dd") });
      setQuestionsLeft(Math.max(0, 5 - newCount));
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const SUGGESTIONS = [
    "Analyser mes d\u00e9penses",
    "\u00c9tat de mes objectifs",
    "Conseil pour \u00e9pargner",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div
        className="rounded-[28px] p-4 mb-6 flex items-center gap-4 shadow-lg"
        style={{ background: "#171E2E", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="relative">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner"
            style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(59,130,246,0.15) 100%)", border: "1px solid rgba(16,185,129,0.3)" }}
          >
            <BrainCircuit size={24} color="#10B981" strokeWidth={1.5} />
          </div>
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#171E2E]"
            style={{ background: "#10B981" }}
          />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-white">Assistant MonBudgetIA</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">En ligne</p>
          </div>
        </div>
        <div
          className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter"
          style={{
            background: "rgba(245,158,11,0.1)",
            color: "#F59E0B",
            border: "1px solid rgba(245,158,11,0.2)",
          }}
        >
          {questionsLeft} requ\u00eates
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-6 pb-6 pr-1" style={{ scrollbarWidth: "none" }}>
        {messages.map((msg) => {
          const isAI = msg.role === "ai" || msg.role === "assistant";
          return (
            <div key={msg.id} className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
              <div className={`flex flex-col ${isAI ? "items-start" : "items-end"} max-w-[85%]`}>
                {isAI && (
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20">
                      <Sparkles size={10} color="#10B981" />
                    </div>
                    <span className="text-[10px] font-black opacity-30 text-white uppercase tracking-widest">MonBudgetIA \u2022 {msg.time}</span>
                  </div>
                )}
                <div
                  className="px-5 py-4 rounded-[24px] text-sm leading-relaxed font-medium shadow-sm"
                  style={
                    !isAI
                      ? {
                          background: "linear-gradient(135deg, #1E2A3E 0%, #171E2E 100%)",
                          color: "#F0F4FF",
                          borderBottomRightRadius: 4,
                          border: "1px solid rgba(255,255,255,0.06)",
                        }
                      : {
                          background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                          color: "#E2E8F0",
                          borderBottomLeftRadius: 4,
                          border: "1px solid rgba(16,185,129,0.15)",
                          backdropFilter: "blur(10px)",
                        }
                  }
                >
                  {msg.text}
                </div>
                {!isAI && (
                  <div className="flex items-center gap-1.5 mt-2 mr-1">
                    <span className="text-[9px] font-bold opacity-20 text-white uppercase">{msg.time}</span>
                    <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center">
                      <User size={8} color="#7A8BA6" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div
              className="px-6 py-4 rounded-3xl"
              style={{
                background: "rgba(16,185,129,0.05)",
                border: "1px solid rgba(16,185,129,0.1)",
                borderBottomLeftRadius: 4,
              }}
            >
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500/40"
                    style={{
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      <div className="flex gap-2 mb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            disabled={questionsLeft <= 0 || isTyping}
            className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap shrink-0 transition-all disabled:opacity-50"
            style={{
              background: "rgba(16,185,129,0.1)",
              color: "#10B981",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{
          background: "#171E2E",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <input
          type="text"
          placeholder={questionsLeft > 0 ? "Posez votre question\u2026" : "Limite quotidienne atteinte"}
          value={input}
          disabled={questionsLeft <= 0 || isTyping}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          className="flex-1 bg-transparent text-sm outline-none disabled:opacity-50"
          style={{ color: "#F0F4FF" }}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || questionsLeft <= 0 || isTyping}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
          style={{
            background: input.trim() && questionsLeft > 0 ? "linear-gradient(135deg, #10B981, #059669)" : "rgba(255,255,255,0.06)",
          }}
        >
          <Send size={15} color={input.trim() && questionsLeft > 0 ? "#fff" : "#7A8BA6"} />
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
