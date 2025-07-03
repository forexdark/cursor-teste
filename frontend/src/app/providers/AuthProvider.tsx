"use client";
import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface AuthContextType {
  backendJwt: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  user: any;
}

const AuthContext = createContext<AuthContextType>({
  backendJwt: null,
  isAuthenticated: false,
  loading: true,
  user: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const sessionData = useSession();
  const session = sessionData?.data || null;
  const status = sessionData?.status || "unauthenticated";
  const [loading, setLoading] = useState(true);
  
  // Extrair JWT do backend da sessão
  const backendJwt = session?.backendJwt || null;
  const isAuthenticated = !!backendJwt && status === "authenticated";
  const user = session?.user || null;
  
  useEffect(() => {
    if (status !== "loading") {
      setLoading(false);
    }
  }, [status]);
  
  // Debug info apenas em desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("🔍 Auth Debug:", {
        status,
        hasSession: !!session,
        hasJWT: !!backendJwt,
        email: session?.user?.email,
        isAuthenticated,
        loading
      });
    }
  }, [status, session, backendJwt, isAuthenticated, loading]);
  
  return (
    <AuthContext.Provider value={{ 
      backendJwt, 
      isAuthenticated, 
      loading: loading || status === "loading",
      user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Também exportar como default para compatibilidade
export default function useAuthHook() {
  return useContext(AuthContext);
}