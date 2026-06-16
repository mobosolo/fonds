import { useState } from "react";
import { Home, ClipboardList, Target, BarChart3, MessageCircle, LucideIcon } from "lucide-react";
import { DashboardScreen } from "./components/DashboardScreen";
import { AIChatScreen } from "./components/AIChatScreen";
import { StatsScreen } from "./components/StatsScreen";
import { HistoryScreen } from "./components/HistoryScreen";
import { GoalsScreen } from "./components/GoalsScreen";
import { AddTransactionModal } from "./components/AddTransactionModal";

// MARKER-MAKE-KIT-INVOKED

type Tab = "dashboard" | "history" | "goals" | "stats" | "chat";

const NAV_ITEMS: { id: Tab; icon: LucideIcon; label: string }[] = [
  { id: "dashboard", icon: Home, label: "Accueil" },
  { id: "history", icon: ClipboardList, label: "Historique" },
  { id: "goals", icon: Target, label: "Objectifs" },
  { id: "stats", icon: BarChart3, label: "Stats" },
  { id: "chat", icon: MessageCircle, label: "IA Chat" },
];

const SCREEN_TITLES: Record<Tab, string> = {
  dashboard: "Tableau de bord",
  history: "Historique",
  goals: "Objectifs",
  stats: "Statistiques",
  chat: "Assistant IA",
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [showAddTx, setShowAddTx] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTxSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: "#0B0F19" }}
    >
      {/* Header — shown for non-dashboard tabs or as a global app bar */}
      <header className="shrink-0 px-6 pt-6 pb-2 safe-top">
        <h1
          style={{
            color: "#F0F4FF",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            fontSize: activeTab === "dashboard" ? 24 : 22,
          }}
        >
          {SCREEN_TITLES[activeTab]}
        </h1>
      </header>

      {/* Content area */}
      <main
        className="flex-1 overflow-y-auto px-5"
        style={{ scrollbarWidth: "none", paddingBottom: 100 }}
      >
        {activeTab === "dashboard" && (
          <DashboardScreen onAddTx={() => setShowAddTx(true)} refreshTrigger={refreshTrigger} />
        )}
        {activeTab === "history" && <HistoryScreen refreshTrigger={refreshTrigger} />}
        {activeTab === "goals" && <GoalsScreen refreshTrigger={refreshTrigger} />}
        {activeTab === "stats" && <StatsScreen refreshTrigger={refreshTrigger} />}
        {activeTab === "chat" && <AIChatScreen />}
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 pb-6 pt-2"
        style={{
          background: "rgba(11,15,25,0.85)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center justify-around px-2 max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center gap-1.5 py-2 px-3 rounded-2xl transition-all"
              >
                <div
                  className="transition-all duration-300"
                  style={{
                    color: isActive ? "#10B981" : "#7A8BA6",
                    transform: isActive ? "translateY(-2px)" : "translateY(0)",
                  }}
                >
                  <Icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: isActive ? "#10B981" : "#7A8BA6",
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div
                    className="absolute bottom-0 w-1 h-1 rounded-full"
                    style={{ background: "#10B981" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Add Transaction Modal */}
      {showAddTx && (
        <AddTransactionModal 
          onClose={() => setShowAddTx(false)} 
          onSuccess={handleTxSuccess}
        />
      )}

      <style>{`
        .safe-top {
          padding-top: env(safe-area-inset-top, 24px);
        }
        main::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
