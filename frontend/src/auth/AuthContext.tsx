import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { getMe } from "../api/client";
import { AuthUser } from "../api/types";
import { clearToken, getToken, setToken, subscribeToken } from "./token";

type AuthStatus = "loading" | "authed" | "anon";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUserState] = useState<AuthUser | null>(null);

  async function loadFromToken() {
    if (!getToken()) {
      setStatus("anon");
      setUserState(null);
      return;
    }
    try {
      const me = await getMe();
      setUserState(me);
      setStatus("authed");
    } catch {
      setStatus("anon");
      setUserState(null);
    }
  }

  useEffect(() => {
    loadFromToken();
    return subscribeToken(() => {
      if (!getToken()) {
        setStatus("anon");
        setUserState(null);
      }
    });
  }, []);

  function login(token: string, authedUser: AuthUser) {
    setToken(token);
    setUserState(authedUser);
    setStatus("authed");
  }

  function setUser(updated: AuthUser) {
    setUserState(updated);
  }

  function logout() {
    clearToken();
    setUserState(null);
    setStatus("anon");
  }

  return (
    <AuthContext.Provider value={{ status, user, login, setUser, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
