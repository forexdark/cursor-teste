"use client";
import { createContext, useContext, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface AuthContextType {
  backendJwt: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  backendJwt: null,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const sessionData = useSession();
  const session = sessionData?.data || null;
  const status = sessionData?.status || "unauthenticated";
  const backendJwt = session?.backendJwt || null;
  const isAuthenticated = !!backendJwt;
  
  return (
    <AuthContext.Provider value={{ backendJwt, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);