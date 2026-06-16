import { useState, useEffect } from "react";
import { Search, Filter as FilterIcon, ShoppingBag, Bus, Home, Gamepad2, Zap, Smartphone, HeartPulse, Banknote, LucideIcon } from "lucide-react";
import { db, Transaction } from "../lib/db";
import { format } from "date-fns";
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

const FILTERS = ["Tout", "Revenus", "Nourriture", "Transport", "Loyer", "Loisirs", "Charges", "Telecom", "Santé"];

interface HistoryScreenProps {
  refreshTrigger?: number;
}

export function HistoryScreen({ refreshTrigger }: HistoryScreenProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTransactions() {
      const txs = await db.getTransactions();
      setTransactions(txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    }
    loadTransactions();
  }, [refreshTrigger]);

  const getIconData = (cat: string) => CAT_ICONS[cat] || { icon: Banknote, color: "#7A8BA6" };

  const filtered = transactions.filter((tx) => {
    const matchSearch = (tx.note || "").toLowerCase().includes(search.toLowerCase()) || tx.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === "Tout" || tx.category === activeFilter || (activeFilter === "Revenus" && tx.type === "income");
    return matchSearch && matchFilter;
  });

  // Group by date
  const grouped = filtered.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const dateStr = format(new Date(tx.date), "d MMM yyyy", { locale: fr });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(tx);
    return acc;
  }, {});

  if (loading) return <div className="p-10 text-center text-white">Chargement...</div>;

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Search */}
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background: "#171E2E", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Search size={16} color="#7A8BA6" />
        <input
          type="text"
          placeholder="Rechercher une transaction…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none font-medium"
          style={{ color: "#F0F4FF" }}
        />
        <FilterIcon size={16} color="#7A8BA6" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95"
            style={
              activeFilter === f
                ? { background: "#10B981", color: "#fff" }
                : { background: "#1E2A3E", color: "#7A8BA6", border: "1px solid rgba(255,255,255,0.06)" }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* Transaction groups */}
      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date}>
          <p className="text-[10px] mb-3 px-1 font-black opacity-40 uppercase tracking-widest text-white">
            {date}
          </p>
          <div
            className="rounded-3xl overflow-hidden"
            style={{ background: "#171E2E", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {txs.map((tx, i) => {
              const { icon: Icon, color } = getIconData(tx.category);
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-4 py-4 active:bg-white/5 transition-colors"
                  style={{
                    borderBottom: i < txs.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0"
                    style={{ background: `${color}12` }}
                  >
                    <Icon size={20} color={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-white">{tx.note || tx.category}</p>
                    <p className="text-[10px] font-bold opacity-40 text-white uppercase">{tx.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black" style={{ color: tx.type === "income" ? "#10B981" : "#F59E0B" }}>
                      {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString("fr-FR")}
                    </p>
                    <p className="text-[9px] font-bold opacity-30 text-white uppercase">FCFA</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
          <Search size={40} color="#7A8BA6" strokeWidth={1.5} />
          <p className="text-sm font-bold text-white">Aucune transaction trouvée</p>
        </div>
      )}
    </div>
  );
}
