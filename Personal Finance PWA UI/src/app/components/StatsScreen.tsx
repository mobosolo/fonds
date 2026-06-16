import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, PiggyBank, ClipboardList, LucideIcon } from "lucide-react";
import { db, Transaction } from "../lib/db";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";

const CAT_COLORS: Record<string, string> = {
  Nourriture: "#10B981",
  Transport: "#F59E0B",
  Loyer: "#3B82F6",
  Loisirs: "#8B5CF6",
  Charges: "#EF4444",
  Telecom: "#F59E0B",
  Santé: "#EF4444",
  Revenus: "#10B981",
  Autres: "#7A8BA6",
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-4 py-3 rounded-2xl text-xs shadow-2xl"
        style={{
          background: "#171E2E",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#F0F4FF",
        }}
      >
        <p className="font-bold mb-1 opacity-50 uppercase tracking-widest text-[9px]">{payload[0].name}</p>
        <p className="font-black text-sm">{payload[0].value.toLocaleString("fr-FR")} FCFA</p>
      </div>
    );
  }
  return null;
};

interface StatsScreenProps {
  refreshTrigger?: number;
}

export function StatsScreen({ refreshTrigger }: StatsScreenProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const txs = await db.getTransactions();
      setTransactions(txs);
      setLoading(false);
    }
    loadData();
  }, [refreshTrigger]);

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const monthTxs = transactions.filter((tx) =>
    isWithinInterval(new Date(tx.date), { start: monthStart, end: monthEnd })
  );

  const totalIncome = monthTxs
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = monthTxs
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const savingRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  const categoryData = monthTxs
    .filter((tx) => tx.type === "expense")
    .reduce((acc, tx) => {
      const existing = acc.find((item) => item.name === tx.category);
      if (existing) {
        existing.value += tx.amount;
      } else {
        acc.push({ name: tx.category, value: tx.amount, color: CAT_COLORS[tx.category] || "#7A8BA6" });
      }
      return acc;
    }, [] as Array<{ name: string; value: number; color: string }>);

  if (loading) return <div className="p-10 text-center text-white">Chargement...</div>;

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Donut Chart */}
      <div
        className="rounded-[32px] p-6"
        style={{ background: "#171E2E", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="mb-6">
          <p className="text-sm font-bold text-white mb-1">
            Répartition des dépenses
          </p>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest text-white">Mois en cours</p>
        </div>

        {categoryData.length > 0 ? (
          <>
            <div className="relative flex items-center justify-center mb-8" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center pointer-events-none">
                <p className="text-3xl font-black" style={{ color: "#F0F4FF", letterSpacing: "-0.04em" }}>
                  {totalExpense.toLocaleString("fr-FR")}
                </p>
                <p className="text-[9px] font-black opacity-30 text-white uppercase tracking-tighter">FCFA dépensés</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {categoryData.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)" }}
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-lg" style={{ background: c.color, boxShadow: `0 0 8px ${c.color}60` }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold truncate text-slate-400">{c.name}</p>
                    <p className="text-xs font-black text-white">
                      {Math.round((c.value / totalExpense) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-4 opacity-20">
            <ClipboardList size={48} color="#fff" strokeWidth={1} />
            <p className="text-xs font-bold uppercase tracking-widest text-white">Aucune donnée ce mois</p>
          </div>
        )}
      </div>

      {/* Monthly Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Revenus", value: totalIncome.toLocaleString("fr-FR"), unit: "FCFA", color: "#10B981", icon: TrendingUp },
          { label: "Dépenses", value: totalExpense.toLocaleString("fr-FR"), unit: "FCFA", color: "#F59E0B", icon: TrendingDown },
          { label: "Épargne", value: savingRate.toString(), unit: "%", color: "#3B82F6", icon: PiggyBank },
          { label: "Transactions", value: monthTxs.length.toString(), unit: "ce mois", color: "#8B5CF6", icon: ClipboardList },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-[28px] p-5"
              style={{ background: "#171E2E", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${item.color}15` }}>
                <Icon size={18} color={item.color} />
              </div>
              <p className="text-xl font-black mb-0.5 text-white" style={{ letterSpacing: "-0.04em" }}>
                {item.value}
              </p>
              <div className="flex items-center gap-1 opacity-40">
                <p className="text-[9px] font-bold text-white uppercase tracking-widest">{item.unit}</p>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{item.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
