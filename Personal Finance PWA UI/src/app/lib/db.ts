export interface Transaction {
  id?: number;
  amount: number;
  type: "income" | "expense";
  category: string;
  note: string;
  date: string; // ISO string
}

export interface Goal {
  id?: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO string
  color: string;
}

export interface AIContext {
  id: string; // "global"
  lastAdviceDate: string | null;
  lastAdviceContent: string | null;
  dailyChatCount: number;
  lastChatDate: string | null;
}

export interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
  date: string; // ISO string
}

const DB_NAME = "MonBudgetIADB";
const DB_VERSION = 1;

export class DB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("transactions")) {
          db.createObjectStore("transactions", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("goals")) {
          db.createObjectStore("goals", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("aiContext")) {
          db.createObjectStore("aiContext", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("chatHistory")) {
          db.createObjectStore("chatHistory", { keyPath: "id", autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.dbPromise;
  }

  async getStore(storeName: string, mode: IDBTransactionMode = "readonly"): Promise<IDBObjectStore> {
    const db = await this.init();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Transactions
  async addTransaction(tx: Transaction): Promise<number> {
    const store = await this.getStore("transactions", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.add(tx);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getTransactions(): Promise<Transaction[]> {
    const store = await this.getStore("transactions");
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Goals
  async addGoal(goal: Goal): Promise<number> {
    const store = await this.getStore("goals", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.add(goal);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async updateGoal(goal: Goal): Promise<void> {
    const store = await this.getStore("goals", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.put(goal);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getGoals(): Promise<Goal[]> {
    const store = await this.getStore("goals");
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // AI Context
  async getAIContext(): Promise<AIContext> {
    const store = await this.getStore("aiContext");
    return new Promise((resolve, reject) => {
      const request = store.get("global");
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          const defaultContext: AIContext = {
            id: "global",
            lastAdviceDate: null,
            lastAdviceContent: null,
            dailyChatCount: 0,
            lastChatDate: null,
          };
          resolve(defaultContext);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateAIContext(context: AIContext): Promise<void> {
    const store = await this.getStore("aiContext", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.put(context);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Chat History
  async addChatMessage(msg: ChatMessage): Promise<number> {
    const store = await this.getStore("chatHistory", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.add(msg);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    const store = await this.getStore("chatHistory");
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearChatHistory(): Promise<void> {
    const store = await this.getStore("chatHistory", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new DB();
