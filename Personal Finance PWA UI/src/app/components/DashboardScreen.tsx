import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, TrendingDown, Plus, ChevronRight, Bell, Settings, ShoppingBag, Bus, Home, Gamepad2, Zap, Smartphone, HeartPulse, Banknote, LucideIcon } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";
import { db, Transaction, Goal } from "../lib/db";
import { getAIAdvice } from "../lib/ai";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

const CAT_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  Nourriture: { icon: ShoppingBag, color: "#10B981" },
  Transport: { icon: Bus, color: "#F59E0B" },
  Loyer: { icon: Home, color: "#3B82F6" },
  Loisirs: { icon: Gamepad2, color: "#8B5CF6" },
  Charges: { icon: Zap, color: "#EF4444" },
  Telecom: { icon: Smartphone, color: "#F59E0B" },
  Santé: { icon: HeartPulse, color: "#EF4444" },
  Revenus: { icon: Banknote, color: "#10B981" },
};

interface DashboardScreenProps {
  onAddTx: () => void;
  refreshTrigger?: number;
}

export function DashboardScreen({ onAddTx, refreshTrigger }: DashboardScreenProps) {
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState<string>("Chargement de votre conseil...");
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem("ANTHROPIC_API_KEY") || "");

  useEffect(() => {
    async function loadData() {
      const [txs, gls, context] = await Promise.all([
        db.getTransactions(),
        db.getGoals(),
        db.getAIContext()
      ]);
      
      setTransactions(txs);
      setGoals(gls);
      
      const todayStr = format(new Date(), "yyyy-MM-dd");
      if (context.lastAdviceDate === todayStr && context.lastAdviceContent) {
        setAdvice(context.lastAdviceContent);
      } else {
        const newAdvice = await getAIAdvice(txs, gls);
        setAdvice(newAdvice);
        await db.updateAIContext({
          ...context,
          lastAdviceDate: todayStr,
          lastAdviceContent: newAdvice
        });
      }
      
      setLoading(false);
    }
    loadData();
  }, [refreshTrigger]);

  const saveApiKey = () => {
    localStorage.setItem("ANTHROPIC_API_KEY", apiKey);
    setShowSettings(false);
    window.location.reload(); 
  };

  const today = new Date();
  const startOfToday = startOfDay(today);

  // Calculate balance
  const totalIncome = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const balance = totalIncome - totalExpense;

  // 7-day chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    const dayTransactions = transactions.filter((tx) => isSameDay(new Date(tx.date), startOfDay(d)));
    return {
      day: format(d, "EEE", { locale: fr }),
      revenue: dayTransactions.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + tx.amount, 0),
      expense: dayTransactions.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + tx.amount, 0),
    };
  });

  const recentTx = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const getIconData = (cat: string) => CAT_ICONS[cat] || { icon: Banknote, color: "#7A8BA6" };

  if (loading) return <div className="p-10 text-center text-white">Chargement...</div>;

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Quick Actions (Settings/Bell) */}
      <div className="flex justify-end gap-3 pt-1">
        <button
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition-active"
          style={{ background: "#171E2E", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Settings size={18} color="#7A8BA6" />
        </button>
        <button
          className="relative w-10 h-10 rounded-2xl flex items-center justify-center transition-active"
          style={{ background: "#171E2E", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Bell size={18} color="#7A8BA6" />
          <span
            className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
            style={{ background: "#10B981" }}
          />
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-6"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6"
            style={{ background: "#171E2E", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <h2 className="text-lg font-bold text-white mb-2">Paramètres IA</h2>
            <p className="text-xs text-slate-400 mb-6">
              Entrez votre clé API Anthropic pour activer les conseils personnalisés.
            </p>
            <input
              type="password"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm bg-slate-900 text-white border border-white/10 mb-6 outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-3 rounded-xl text-sm text-slate-400 font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={saveApiKey}
                className="flex-1 py-3 rounded-xl text-sm bg-emerald-600 text-white font-bold"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Insight Banner */}
      <div
        className="rounded-3xl p-4 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(59,130,246,0.08) 100%)",
          border: "1px solid rgba(16,185,129,0.25)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "rgba(16,185,129,0.2)" }}
          >
            <Sparkles size={18} color="#10B981" />
          </div>
          <div>
            <p className="text-[10px] mb-1 opacity-80" style={{ color: "#10B981", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Conseil IA
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#F0F4FF" }}>
              {advice}
            </p>
          </div>
        </div>
      </div>

      {/* Hero Balance */}
      <div
        className="rounded-[32px] p-6"
        style={{ background: "linear-gradient(180deg, #171E2E 0%, #111827 100%)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-[10px] mb-2 opacity-60" style={{ color: "#F0F4FF", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
          Solde total
        </p>
        <div className="flex items-end gap-2 mb-6">
          <span
            className="text-5xl"
            style={{ color: balance >= 0 ? "#10B981" : "#F59E0B", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}
          >
            {balance.toLocaleString("fr-FR")}
          </span>
          <span className="text-lg mb-1" style={{ color: balance >= 0 ? "#10B981" : "#F59E0B", fontWeight: 600 }}>
            FCFA
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.1)" }}>
              <TrendingUp size={14} color="#10B981" />
            </div>
            <div>
              <p className="text-[10px] opacity-40 text-white uppercase font-bold">Revenus</p>
              <p className="text-sm font-bold text-white">+{totalIncome.toLocaleString("fr-FR")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-l border-white/5 pl-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)" }}>
              <TrendingDown size={14} color="#F59E0B" />
            </div>
            <div>
              <p className="text-[10px] opacity-40 text-white uppercase font-bold">Dépenses</p>
              <p className="text-sm font-bold text-white">-{totalExpense.toLocaleString("fr-FR")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Bar Chart */}
      <div
        className="rounded-3xl p-5"
        style={{ background: "#171E2E", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-bold text-white">Activité 7j</p>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#10B981" }} />
              <span className="text-[10px] opacity-60 text-white">Revenu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#F59E0B" }} />
              <span className="text-[10px] opacity-60 text-white">Dépense</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData} barGap={4} barCategoryGap="25%">
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#7A8BA6", fontSize: 10, fontWeight: 600 }}
            />
            <Bar dataKey="revenue" radius={[3, 3, 0, 0]} onMouseEnter={(_, i) => setActiveBar(i)} onMouseLeave={() => setActiveBar(null)}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={activeBar === i ? "#10B981" : "rgba(16,185,129,0.4)"} />
              ))}
            </Bar>
            <Bar dataKey="expense" radius={[3, 3, 0, 0]} onMouseEnter={(_, i) => setActiveBar(i)} onMouseLeave={() => setActiveBar(null)}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={activeBar === i ? "#F59E0B" : "rgba(245,158,11,0.3)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Savings Goals */}
      <div
        className="rounded-3xl p-5"
        style={{ background: "#171E2E", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-bold text-white">Objectifs d'épargne</p>
          <ChevronRight size={16} color="#7A8BA6" />
        </div>
        <div className="flex flex-col gap-5">
          {goals.length === 0 && <p className="text-xs text-center py-2 opacity-40 text-white">Aucun objectif défini</p>}
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            return (
              <div key={g.id}>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-semibold text-slate-300">{g.name}</p>
                  <p className="text-xs font-bold" style={{ color: g.color }}>{pct}%</p>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${g.color}80, ${g.color})`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div
        className="rounded-3xl p-5"
        style={{ background: "#171E2E", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-white">Récentes</p>
          <button className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Tout voir</button>
        </div>
        <div className="flex flex-col gap-4">
          {recentTx.length === 0 && <p className="text-xs text-center py-4 opacity-40 text-white">Aucune transaction</p>}
          {recentTx.map((tx) => {
            const { icon: Icon, color } = getIconData(tx.category);
            return (
              <div key={tx.id} className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: `${color}15` }}
                >
                  <Icon size={18} color={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-white">{tx.note || tx.category}</p>
                  <p className="text-[10px] opacity-40 text-white font-medium">{format(new Date(tx.date), "d MMM, HH:mm", { locale: fr })}</p>
                </div>
                <p
                  className="text-sm font-bold shrink-0"
                  style={{
                    color: tx.type === "income" ? "#10B981" : "#F59E0B",
                  }}
                >
                  {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString("fr-FR")}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={onAddTx}
        className="fixed right-6 bottom-28 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl z-40 active:scale-95 transition-transform"
        style={{
          background: "linear-gradient(135deg, #10B981, #059669)",
          boxShadow: "0 8px 32px rgba(16,185,129,0.45)",
        }}
      >
        <Plus size={24} color="#fff" strokeWidth={3} />
      </button>

      <style>{`
        .transition-active:active {
          transform: scale(0.92);
        }
      `}</style>
    </div>
  );
}
