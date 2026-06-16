import { Transaction, Goal } from "./db";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ANTHROPIC_API_KEY = localStorage.getItem("ANTHROPIC_API_KEY") || "";

export async function getAIAdvice(transactions: Transaction[], goals: Goal[]): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return "Bienvenue ! Ajoutez vos revenus et dépenses pour recevoir des conseils personnalisés. (Note: Clé API manquante dans les paramètres)";
  }

  const context = prepareContext(transactions, goals);
  const prompt = `Tu es MonBudgetIA, un conseiller financier personnel expert à Lomé, Togo. 
  Aujourd'hui nous sommes le ${format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}.
  Analyse les données financières de l'utilisateur et donne un seul conseil court, motivant et pratique (max 2 phrases). 
  Utilise un ton amical et local si approprié (FCFA, habitudes de Lomé).
  
  Données :
  ${context}
  
  Conseil :`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "dangerously-allow-browser": "true"
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-latest",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.content[0].text;
  } catch (error: any) {
    console.error("AI Advice Error:", error);
    return "Oups, je n'ai pas pu générer de conseil. Vérifiez votre clé API ou votre connexion.";
  }
}

export async function chatWithAI(message: string, transactions: Transaction[], goals: Goal[], history: any[]): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return "Je suis en mode démo. Pour une vraie analyse, configurez votre clé API Anthropic dans les paramètres (icône engrenage sur l'accueil).";
  }

  const context = prepareContext(transactions, goals);
  const systemPrompt = `Tu es MonBudgetIA, un conseiller financier personnel expert à Lomé. 
  Aujourd'hui nous sommes le ${format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}.
  Tu as accès au contexte financier complet de l'utilisateur. 
  Réponds de manière concise, précise et utile. Utilise le FCFA. 
  Si l'utilisateur demande s'il peut se permettre un achat, base-toi sur son solde et ses dépenses récentes.
  
  Contexte :
  ${context}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "dangerously-allow-browser": "true"
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-latest",
        max_tokens: 600,
        system: systemPrompt,
        messages: history.map(h => ({ role: h.role, content: h.content || h.text }))
          .concat([{ role: "user", content: message }])
          .slice(-11) // Keep history manageable
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.content[0].text;
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return `Erreur: ${error.message || "Impossible de contacter l'IA."}`;
  }
}

function prepareContext(transactions: Transaction[], goals: Goal[]): string {
  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const recentTxs = transactions.slice(-15).map(t => `- ${format(new Date(t.date), "dd/MM")}: ${t.type === "income" ? "+" : "-"}${t.amount} (${t.category}: ${t.note})`).join("\n");
  const goalsProgress = goals.map(g => `- ${g.name}: ${g.currentAmount}/${g.targetAmount} FCFA (Fin: ${g.deadline})`).join("\n");

  return `
  REVENUS TOTAUX: ${totalIncome} FCFA
  DÉPENSES TOTALES: ${totalExpense} FCFA
  SOLDE ACTUEL: ${totalIncome - totalExpense} FCFA
  
  OBJECTIFS D'ÉPARGNE:
  ${goalsProgress || "Aucun objectif défini"}
  
  15 DERNIÈRES TRANSACTIONS:
  ${recentTxs || "Aucune transaction"}
  `;
}
