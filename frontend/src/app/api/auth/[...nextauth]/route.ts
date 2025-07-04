import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

// Validar variáveis de ambiente críticas
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "https://vigia-meli.vercel.app";

console.log("🔍 NextAuth Environment Check:", {
  hasGoogleClientId: !!GOOGLE_CLIENT_ID,
  hasGoogleClientSecret: !!GOOGLE_CLIENT_SECRET,
  hasNextAuthSecret: !!NEXTAUTH_SECRET,
  nextAuthUrl: NEXTAUTH_URL,
  nodeEnv: process.env.NODE_ENV
});

const authOptions: NextAuthOptions = {
  providers: [
    // Google Provider - só adicionar se as credenciais existirem
    ...(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      })
    ] : []),
    
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Credenciais faltando");
          return null;
        }

        console.log("🔐 Tentando autenticar:", credentials.email);

        try {
          // URLs de backend em ordem de preferência
          const backendUrls = [
            'https://vigia-meli.up.railway.app',
            process.env.NEXT_PUBLIC_API_URL,
            'http://localhost:8000'
          ].filter(Boolean);

          let loginData = null;
          let workingUrl = null;

          // Tentar cada URL de backend
          for (const apiUrl of backendUrls) {
            try {
              console.log("🌐 Tentando backend:", apiUrl);
              
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos

              const res = await fetch(`${apiUrl}/auth/login`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: credentials.email,
                  senha: credentials.password,
                }),
                signal: controller.signal
              });

              clearTimeout(timeoutId);

              if (res.ok) {
                const data = await res.json();
                console.log("✅ Login bem-sucedido:", apiUrl);
                loginData = data;
                workingUrl = apiUrl;
                break;
              } else {
                const errorData = await res.json().catch(() => ({}));
                console.log("❌ Erro HTTP:", res.status, errorData);
                if (res.status === 401) {
                  // Se 401, credenciais incorretas - não tentar outras URLs
                  break;
                }
              }
            } catch (apiError) {
              console.log("❌ Erro na API:", apiUrl, apiError);
              continue;
            }
          }

          if (loginData && workingUrl) {
            const userData = {
              id: loginData.user?.id?.toString() || "1",
              email: credentials.email,
              name: loginData.user?.nome || credentials.email.split('@')[0],
              backendJwt: loginData.access_token,
              backendUrl: workingUrl
            };
            
            console.log("✅ Retornando user data:", {
              ...userData,
              backendJwt: userData.backendJwt ? "presente" : "ausente"
            });
            
            return userData;
          } else {
            console.log("❌ Falha em todos os backends ou credenciais incorretas");
            return null;
          }
        } catch (error) {
          console.error("❌ Erro geral na autenticação:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      console.log("🎫 JWT Callback:", {
        hasToken: !!token,
        hasUser: !!user,
        hasAccount: !!account,
        provider: account?.provider,
        tokenKeys: token ? Object.keys(token) : [],
        userKeys: user ? Object.keys(user) : []
      });
      
      // Para Google OAuth
      if (account?.provider === "google" && profile?.email) {
        console.log("🔍 Processando Google OAuth...");
        try {
          const backendUrls = [
            'https://vigia-meli.up.railway.app',
            process.env.NEXT_PUBLIC_API_URL
          ].filter(Boolean);

          let googleSuccess = false;
          
          for (const apiUrl of backendUrls) {
            try {
              console.log("🌐 Tentando Google OAuth:", apiUrl);
              
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 8000);

              const res = await fetch(`${apiUrl}/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  token_id: account.id_token,
                  email: profile.email,
                  name: profile.name
                }),
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);
              
              if (res.ok) {
                const data = await res.json();
                token.backendJwt = data.access_token;
                token.backendUrl = apiUrl;
                console.log("✅ Google OAuth bem-sucedido");
                googleSuccess = true;
                break;
              } else {
                console.log("⚠️ Google OAuth falhou:", res.status);
              }
            } catch (apiError) {
              console.log("❌ Erro Google OAuth:", apiUrl, apiError);
              continue;
            }
          }
          
          if (!googleSuccess) {
            // Para desenvolvimento, criar um mock token válido
            if (process.env.NODE_ENV === 'development') {
              console.log("🔧 Usando token mock para desenvolvimento");
              token.backendJwt = `mock-google-${Date.now()}`;
              token.backendUrl = 'mock-development';
            } else {
              console.log("❌ Google OAuth falhou em produção");
            }
          }
        } catch (error) {
          console.error("❌ Erro Google OAuth:", error);
          if (process.env.NODE_ENV === 'development') {
            token.backendJwt = `mock-google-error-${Date.now()}`;
          }
        }
      }
      
      // Para login com credenciais
      if (user?.backendJwt) {
        console.log("✅ Usando JWT do backend de credenciais");
        token.backendJwt = user.backendJwt;
        token.backendUrl = user.backendUrl;
      }
      
      console.log("🎫 JWT Final:", {
        hasBackendJwt: !!token.backendJwt,
        backendUrl: token.backendUrl
      });
      
      return token;
    },
    async session({ session, token }) {
      // CRÍTICO: Garantir que o backendJwt seja passado para a sessão
      (session as any).backendJwt = token.backendJwt;
      (session as any).backendUrl = token.backendUrl;
      
      console.log("🎫 Sessão configurada:", {
        hasJwt: !!token.backendJwt,
        backendUrl: token.backendUrl,
        email: session.user?.email,
        sessionKeys: Object.keys(session)
      });
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      const redirectBase = NEXTAUTH_URL || baseUrl;
      
      if (url.startsWith("/") && !url.startsWith("//")) {
        return `${redirectBase}${url}`;
      } else if (url.startsWith(redirectBase)) {
        return url;
      }
      return `${redirectBase}/dashboard`;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === 'development',
  secret: NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };