"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export interface CustomUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

interface AuthContextType {
  user: CustomUser | User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = typeof window !== "undefined" ? localStorage.getItem("ab_invest_user") : null;
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem("ab_invest_user", JSON.stringify({ uid: currentUser.uid, email: currentUser.email }));
      } else {
        const local = typeof window !== "undefined" ? localStorage.getItem("ab_invest_user") : null;
        if (local) {
          try {
            setUser(JSON.parse(local));
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      try {
        const res = await signInWithEmailAndPassword(auth, email, pass);
        setUser(res.user);
        localStorage.setItem("ab_invest_user", JSON.stringify({ uid: res.user.uid, email: res.user.email }));
        return;
      } catch (err: any) {
        if (err.code !== "auth/user-not-found" && err.code !== "auth/invalid-credential") {
          console.warn("Firebase Auth error:", err);
        }
      }
    }

    const storedAccountsRaw = localStorage.getItem("ab_invest_accounts");
    const accounts = storedAccountsRaw ? JSON.parse(storedAccountsRaw) : {};

    if (!accounts[email]) {
      accounts[email] = pass;
      localStorage.setItem("ab_invest_accounts", JSON.stringify(accounts));
    }

    if (accounts[email] === pass) {
      const u: CustomUser = { uid: "user_" + Date.now(), email };
      setUser(u);
      localStorage.setItem("ab_invest_user", JSON.stringify(u));
    } else {
      throw new Error("Senha incorreta.");
    }
  };

  const signup = async (email: string, pass: string) => {
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        setUser(res.user);
        localStorage.setItem("ab_invest_user", JSON.stringify({ uid: res.user.uid, email: res.user.email }));
        return;
      } catch (err: any) {
        console.warn("Firebase Auth signup fallback:", err);
      }
    }

    const storedAccountsRaw = localStorage.getItem("ab_invest_accounts");
    const accounts = storedAccountsRaw ? JSON.parse(storedAccountsRaw) : {};
    accounts[email] = pass;
    localStorage.setItem("ab_invest_accounts", JSON.stringify(accounts));

    const u: CustomUser = { uid: "user_" + Date.now(), email };
    setUser(u);
    localStorage.setItem("ab_invest_user", JSON.stringify(u));
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    localStorage.removeItem("ab_invest_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

