"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("pp_token");
    const storedUser = localStorage.getItem("pp_user");
    if (stored && storedUser) {
      setToken(stored);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await axios.post("/api/auth/login", { email, password });
    const { access_token, user: u } = res.data;
    setToken(access_token);
    setUser(u);
    localStorage.setItem("pp_token", access_token);
    localStorage.setItem("pp_user", JSON.stringify(u));
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await axios.post("/api/auth/register", { email, password, name });
    const { access_token, user: u } = res.data;
    setToken(access_token);
    setUser(u);
    localStorage.setItem("pp_token", access_token);
    localStorage.setItem("pp_user", JSON.stringify(u));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("pp_token");
    localStorage.removeItem("pp_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
