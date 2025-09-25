import React, { createContext, useContext, useEffect, useState } from "react";
import { addTransaction } from "@/lib/coins";

export type User = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: "citizen" | "admin" | null;
  department?: string;
  civicCoins?: number;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number, reason?: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS: Array<{ email: string; password: string; role: "citizen" | "admin"; name: string; department?: string; phone?: string; civicCoins?: number }> = [
  { email: "citizen@example.com", password: "password123", role: "citizen", name: "Citizen", phone: "+91-0000000000", civicCoins: 0 },
  { email: "admin@roads.gov.in", password: "password123", role: "admin", name: "Roads Admin", department: "Roads Department" },
  { email: "admin@electrical.gov.in", password: "password123", role: "admin", name: "Electrical Admin", department: "Electrical Department" },
  { email: "admin@sanitation.gov.in", password: "password123", role: "admin", name: "Sanitation Admin", department: "Sanitation Department" },
  { email: "admin@municipal.gov.in", password: "password123", role: "admin", name: "Municipal Admin", department: "Municipal" },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("civicai_user");
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem("civicai_user", JSON.stringify(user));
    else localStorage.removeItem("civicai_user");
  }, [user]);

  const login = (email: string, password: string) => {
    const found = USERS.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!found) return false;
    const coinKey = `civicai_coins_${found.email.toLowerCase()}`;
    let persistedCoins: number | undefined = undefined;
    try {
      const rawCoins = localStorage.getItem(coinKey);
      if (rawCoins !== null) persistedCoins = parseInt(rawCoins || "0");
    } catch (e) {}
    const session: User = {
      id: found.email,
      name: found.name,
      email: found.email,
      phone: found.phone,
      role: found.role,
      department: found.department,
      civicCoins: persistedCoins ?? found.civicCoins ?? 0,
    };
    setUser(session);
    return true;
  };

  const addCoins = (amount: number, reason = "Reward", issueId?: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, civicCoins: (prev.civicCoins || 0) + amount };
      try {
        addTransaction({ userId: next.id, userName: next.name, amount, reason, issueId });
      } catch (e) {}
      try {
        const coinKey = `civicai_coins_${next.id?.toLowerCase()}`;
        localStorage.setItem(coinKey, String(next.civicCoins || 0));
      } catch (e) {}
      return next;
    });
  };

  const spendCoins = (amount: number, reason = "Purchase") => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, civicCoins: Math.max(0, (prev.civicCoins || 0) - amount) };
      try {
        addTransaction({ userId: next.id, userName: next.name, amount: -Math.abs(amount), reason });
      } catch (e) {}
      try {
        const coinKey = `civicai_coins_${next.id?.toLowerCase()}`;
        localStorage.setItem(coinKey, String(next.civicCoins || 0));
      } catch (e) {}
      return next;
    });
  };

  const logout = () => {
    setUser(null);
    try { localStorage.removeItem("civicai_user"); } catch (e) {}
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, addCoins, spendCoins }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
