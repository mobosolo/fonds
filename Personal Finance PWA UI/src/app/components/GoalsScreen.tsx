import { useState, useEffect } from "react";
import { Plus, Target, X, Trash2, Calendar, TrendingUp } from "lucide-react";
import { db, Goal } from "../lib/db";

function formatFCFA(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

interface GoalsScreenProps {
  refreshTrigger?: number;
}

export function GoalsScreen({ refreshTrigger }: GoalsScreenProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({ label: "", target: "", deadline: "" });
  const [updatingGoalId, setUpdatingGoalId] = useState<number | null>(null);
  const [updateAmount, setUpdateAmount] = useState("");

  useEffect(() => {
    async function loadGoals() {
      const gls = await db.getGoals();
      setGoals(gls);
      setLoading(false);
    }
    loadGoals();
  }, [refreshTrigger]);

  const addGoal = async () => {
    if (!newGoal.label || !newGoal.target) return;
    await db.addGoal({
      name: newGoal.label,
      targetAmount: parseInt(newGoal.target),
      currentAmount: 0,
      deadline: newGoal.deadline || "—",
      color: "#10B981",
    });
    const gls = await db.getGoals();
    setGoals(gls);
    setShowModal(false);
    setNewGoal({ label: "", target: "", deadline: "" });
  };

  const updateProgression = async (goal: Goal) => {
    const amt = parseInt(updateAmount);
    if (isNaN(amt)) return;
    await db.updateGoal({
      ...goal,
      currentAmount: goal.currentAmount + amt,
    });
    const gls = await db.getGoals();
    setGoals(gls);
    setUpdatingGoalId(null);
    setUpdateAmount("");
  };

  if (loading) return <div className="p-10 text-center text-white">Chargement...</div>;

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Header summary */}
      <div
        className="rounded-3xl p-5"
        style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(59,130,246,0.08) 100%)",
          border: "1px solid rgba(16,185,129,0.2)",
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "rgba(16,185,129,0.2)" }}>
            <TrendingUp size={22} color="#10B981" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest text-white">Progression</p>
            <p className="text-base font-bold text-white truncate">
              {goals.length} objectifs en cours
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest text-white">Total</p>
            <p className="text-base font-black text-emerald-500">
              {goals.reduce((s, g) => s + g.currentAmount, 0).toLocaleString("fr-FR")} F
            </p>
          </div>
        </div>
      </div>

      {/* Goal cards */}
      <div className="flex flex-col gap-4">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
          const remaining = g.targetAmount - g.currentAmount;
          return (
            <div
              key={g.id}
              className="rounded-[32px] p-5"
              style={{ background: "#171E2E", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: `${g.color}12`, border: `1px solid ${g.color}20` }}
                >
                  <Target size={22} color={g.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-white truncate mb-1">{g.name}</p>
                  <div className="flex items-center gap-1.5 opacity-40">
                    <Calendar size={12} color="#fff" />
                    <p className="text-[10px] font-bold text-white uppercase tracking-tight">{g.deadline}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black" style={{ color: g.color, letterSpacing: "-0.04em" }}>{pct}%</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full mb-5 overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${g.color}90, ${g.color})`,
                    boxShadow: `0 0 12px ${g.color}40`,
                  }}
                />
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div>
                  <p className="text-[9px] font-bold opacity-30 text-white uppercase mb-1">Épargné</p>
                  <p className="text-xs font-bold text-white">{g.currentAmount.toLocaleString("fr-FR")} F</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold opacity-30 text-white uppercase mb-1">Reste</p>
                  <p className="text-xs font-bold text-amber-500">{remaining.toLocaleString("fr-FR")} F</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold opacity-30 text-white uppercase mb-1">Cible</p>
                  <p className="text-xs font-bold text-white">{g.targetAmount.toLocaleString("fr-FR")} F</p>
                </div>
              </div>

              {updatingGoalId === g.id ? (
                <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-200">
                  <input
                    type="number"
                    placeholder="Montant..."
                    autoFocus
                    value={updateAmount}
                    onChange={(e) => setUpdateAmount(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl text-sm bg-slate-900 text-white border border-white/10 outline-none"
                  />
                  <button
                    onClick={() => updateProgression(g)}
                    className="px-6 py-3 rounded-xl text-xs font-bold bg-emerald-500 text-white shadow-lg"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setUpdatingGoalId(null)}
                    className="px-4 py-3 rounded-xl text-xs font-bold bg-white/5 text-white/50"
                  >
                    X
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setUpdatingGoalId(g.id!)}
                  className="w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-white/40 hover:bg-white/10 transition-all border border-transparent active:border-white/10"
                >
                  Ajouter de l'épargne
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full py-5 rounded-[28px] flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        style={{
          background: "rgba(16,185,129,0.05)",
          border: "2px dashed rgba(16,185,129,0.2)",
          color: "#10B981",
        }}
      >
        <Plus size={18} strokeWidth={3} />
        <span className="text-xs font-black uppercase tracking-widest">Nouvel objectif</span>
      </button>

      {/* Add Goal Modal */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-end justify-center z-50 p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-[32px] p-6 animate-in slide-in-from-bottom-10 duration-300"
            style={{ background: "#0B0F19", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <p className="text-base font-bold text-white">Nouvel objectif d'épargne</p>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5">
                <X size={18} color="#7A8BA6" />
              </button>
            </div>

            <div className="flex flex-col gap-5">
              {[
                { label: "Nom de l'objectif", key: "label", type: "text", placeholder: "Ex: Voyage, Moto..." },
                { label: "Montant cible (FCFA)", key: "target", type: "number", placeholder: "Ex: 500000" },
                { label: "Date limite", key: "deadline", type: "text", placeholder: "Ex: Décembre 2026" },
              ].map((f) => (
                <div key={f.key}>
                  <p className="text-[10px] font-bold opacity-40 text-white uppercase tracking-widest mb-2.5 ml-1">{f.label}</p>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={newGoal[f.key as keyof typeof newGoal]}
                    onChange={(e) => setNewGoal((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-4 py-4 rounded-2xl text-sm font-medium outline-none"
                    style={{
                      background: "#171E2E",
                      color: "#F0F4FF",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  />
                </div>
              ))}

              <button
                onClick={addGoal}
                className="w-full py-4 mt-2 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all"
                style={{
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  color: "#fff",
                }}
              >
                Créer l'objectif
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
