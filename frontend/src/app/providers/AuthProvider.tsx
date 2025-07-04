"use client";
import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface AuthContextType {
  backendJwt: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  user: any;
  debugInfo: string;
}

const AuthContext = createContext<AuthContextType>({
  backendJwt: null,
  isAuthenticated: false,
  loading: true,
  user: null,
  debugInfo: "",
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const sessionData = useSession();
  const session = sessionData?.data || null;
  const status = sessionData?.status || "unauthenticated";
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState("");
  
  // Extrair JWT do backend da sessão - MÚLTIPLAS TENTATIVAS
  let backendJwt: string | null = null;
  
  // Tentativa 1: Verificar se existe na sessão NextAuth
  if (session?.backendJwt) {
    backendJwt = session.backendJwt;
    setDebugInfo("✅ JWT encontrado na sessão NextAuth");
  }
  // Tentativa 2: Verificar se foi setado como propriedade customizada
  else if ((session as any)?.backendJwt) {
    backendJwt = (session as any).backendJwt;
    setDebugInfo("✅ JWT encontrado como propriedade customizada");
  }
  // Tentativa 3: Para desenvolvimento, criar um JWT mock se estiver logado
  else if (status === "authenticated" && session?.user?.email && process.env.NODE_ENV === 'development') {
    backendJwt = `mock-jwt-${Date.now()}`;
    setDebugInfo("🔧 JWT mock para desenvolvimento");
  }
  // Tentativa 4: Verificar localStorage como backup (não recomendado, mas funcional)
  else if (typeof window !== 'undefined' && status === "authenticated") {
    const storedJwt = localStorage.getItem('vigia-backend-jwt');
    if (storedJwt) {
      backendJwt = storedJwt;
      setDebugInfo("📱 JWT encontrado no localStorage");
    } else {
      setDebugInfo("❌ JWT não encontrado em lugar nenhum");
    }
  }
  
  const isAuthenticated = (status === "authenticated" && !!session?.user?.email) || !!backendJwt;
  const user = session?.user || null;
  
  useEffect(() => {
    if (status !== "loading") {
      setLoading(false);
    }
  }, [status]);
  
  // Debug info detalhado apenas em desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("🔍 Auth Debug Completo:", {
        status,
        hasSession: !!session,
        hasJWT: !!backendJwt,
        jwtSource: backendJwt ? debugInfo : "nenhum",
        email: session?.user?.email,
        isAuthenticated,
        loading,
        sessionKeys: session ? Object.keys(session) : [],
        userKeys: session?.user ? Object.keys(session.user) : []
      });
    }
  }, [status, session, backendJwt, isAuthenticated, loading, debugInfo]);
  
  return (
    <AuthContext.Provider value={{ 
      backendJwt, 
      isAuthenticated, 
      loading: loading || status === "loading",
      user,
      debugInfo
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

export default function useAuthHook() {
  return useContext(AuthContext);
}