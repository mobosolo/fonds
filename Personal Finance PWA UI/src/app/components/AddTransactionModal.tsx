import { useState } from "react";
import { X, ArrowUpCircle, ArrowDownCircle, ShoppingBag, Bus, Home, Gamepad2, Zap, Smartphone, HeartPulse, Banknote, LucideIcon } from "lucide-react";
import { db } from "../lib/db";

const CATEGORIES: { icon: LucideIcon; label: string; color: string }[] = [
  { icon: ShoppingBag, label: "Nourriture", color: "#10B981" },
  { icon: Bus, label: "Transport", color: "#F59E0B" },
  { icon: Home, label: "Loyer", color: "#3B82F6" },
  { icon: Gamepad2, label: "Loisirs", color: "#8B5CF6" },
  { icon: Zap, label: "Charges", color: "#EF4444" },
  { icon: Smartphone, label: "Telecom", color: "#F59E0B" },
  { icon: HeartPulse, label: "Santé", color: "#EF4444" },
  { icon: Banknote, label: "Revenus", color: "#10B981" },
];

interface AddTransactionModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddTransactionModal({ onClose, onSuccess }: AddTransactionModalProps) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!amount || !cat) return;
    
    try {
      await db.addTransaction({
        amount: parseFloat(amount),
        type,
        category: cat,
        note,
        date: new Date().toISOString(),
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to add transaction:", error);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-end justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[32px] pb-8 animate-in fade-in slide-in-from-bottom-10 duration-300"
        style={{ background: "#0B0F19", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        <div className="px-6">
          <div className="flex items-center justify-between mb-6">
            <p className="text-base" style={{ color: "#F0F4FF", fontWeight: 700 }}>
              Nouvelle transaction
            </p>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "#171E2E" }}
            >
              <X size={16} color="#7A8BA6" />
            </button>
          </div>

          {/* Type toggle */}
          <div
            className="flex rounded-2xl p-1 mb-6"
            style={{ background: "#171E2E" }}
          >
            {[
              { key: "expense", label: "Dépense", icon: ArrowDownCircle, color: "#F59E0B" },
              { key: "income", label: "Revenu", icon: ArrowUpCircle, color: "#10B981" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key as "expense" | "income")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all text-sm"
                style={
                  type === t.key
                    ? { background: "#1E2A3E", color: t.color, fontWeight: 600 }
                    : { color: "#7A8BA6" }
                }
              >
                <t.icon size={15} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="mb-6 text-center">
            <p className="text-[10px] mb-2 font-bold opacity-40 uppercase tracking-widest text-white">
              Montant
            </p>
            <div className="flex items-center justify-center gap-2">
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-transparent outline-none text-center w-48"
                style={{ color: type === "expense" ? "#F59E0B" : "#10B981", fontSize: 44, fontWeight: 800, letterSpacing: "-0.04em" }}
              />
              <span className="text-lg opacity-40 text-white font-bold">FCFA</span>
            </div>
          </div>

          {/* Category */}
          <div className="mb-4">
            <p className="text-[10px] mb-3 font-bold opacity-40 uppercase tracking-widest text-white">
              Catégorie
            </p>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const isSelected = cat === c.label;
                return (
                  <button
                    key={c.label}
                    onClick={() => setCat(c.label)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
                    style={
                      isSelected
                        ? {
                            background: `${c.color}15`,
                            border: `1px solid ${c.color}40`,
                          }
                        : {
                            background: "#171E2E",
                            border: "1px solid rgba(255,255,255,0.04)",
                          }
                    }
                  >
                    <Icon size={18} color={isSelected ? c.color : "#7A8BA6"} />
                    <span className="text-[10px] font-bold" style={{ color: isSelected ? c.color : "#7A8BA6" }}>
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Note (optionnel)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl text-sm outline-none font-medium"
              style={{
                background: "#171E2E",
                color: "#F0F4FF",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full py-4 rounded-[20px] text-sm transition-all active:scale-[0.98]"
            style={{
              background: amount && cat
                ? "linear-gradient(135deg, #10B981, #059669)"
                : "rgba(255,255,255,0.06)",
              color: amount && cat ? "#fff" : "#7A8BA6",
              fontWeight: 700,
            }}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
