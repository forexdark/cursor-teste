"use client";
import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface AuthContextType {
  backendJwt: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  backendJwt: null,
  isAuthenticated: false,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const sessionData = useSession();
  const session = sessionData?.data || null;
  const status = sessionData?.status || "unauthenticated";
  const [loading, setLoading] = useState(true);
  
  const backendJwt = session?.backendJwt || null;
  const isAuthenticated = !!backendJwt;
  
  useEffect(() => {
    if (status !== "loading") {
      setLoading(false);
    }
  }, [status]);
  
  // Debug info
  console.log("Auth Debug:", {
    status,
    hasSession: !!session,
    hasJWT: !!backendJwt,
    email: session?.user?.email
  });
  
  return (
    <AuthContext.Provider value={{ backendJwt, isAuthenticated, loading }}>
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