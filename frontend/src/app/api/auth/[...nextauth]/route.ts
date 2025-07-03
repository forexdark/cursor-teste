import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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
          // URLs de fallback para desenvolvimento e produção
          const apiUrls = [
            process.env.NEXT_PUBLIC_API_URL,
            'https://vigia-meli.up.railway.app',
            'http://localhost:8000'
          ].filter(Boolean);

          let loginSuccess = false;
          let userData = null;

          // Tentar cada URL até uma funcionar
          for (const apiUrl of apiUrls) {
            try {
              console.log("🌐 Tentando API:", apiUrl);
              
              const res = await fetch(`${apiUrl}/auth/login`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: credentials.email,
                  senha: credentials.password,
                }),
                timeout: 10000, // 10 segundos
              });

              if (res.ok) {
                const data = await res.json();
                console.log("✅ Login bem-sucedido no backend:", apiUrl);
                userData = data;
                loginSuccess = true;
                break;
              } else {
                const errorData = await res.json().catch(() => ({}));
                console.log("❌ Erro HTTP:", res.status, errorData);
              }
            } catch (apiError) {
              console.log("❌ Erro na API:", apiUrl, apiError);
              continue; // Tentar próxima URL
            }
          }

          if (loginSuccess && userData) {
            return {
              id: userData.user?.id?.toString() || "1",
              email: credentials.email,
              name: userData.user?.nome || credentials.email.split('@')[0],
              backendJwt: userData.access_token,
            };
          } else {
            // Se todas as URLs falharam, retornar erro
            console.log("❌ Todas as tentativas de conexão falharam");
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
      // Para Google OAuth
      if (account && profile?.email) {
        console.log("🔍 Processando Google OAuth...");
        try {
          // URLs de fallback
          const apiUrls = [
            process.env.NEXT_PUBLIC_API_URL,
            'https://vigia-meli.up.railway.app'
          ].filter(Boolean);

          let googleSuccess = false;
          
          for (const apiUrl of apiUrls) {
            try {
              console.log("🌐 Tentando Google OAuth com:", apiUrl);
              const res = await fetch(`${apiUrl}/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token_id: account.id_token }),
                timeout: 10000,
              });
              
              if (res.ok) {
                const data = await res.json();
                token.backendJwt = data.access_token;
                console.log("✅ Google OAuth bem-sucedido");
                googleSuccess = true;
                break;
              }
            } catch (apiError) {
              console.log("❌ Erro Google OAuth:", apiUrl, apiError);
              continue;
            }
          }
          
          if (!googleSuccess) {
            console.log("⚠️ Google OAuth falhou, usando token mock");
            // Token mock mais robusto para desenvolvimento
            token.backendJwt = `mock-jwt-google-${profile?.email?.split('@')[0]}-${Date.now()}`;
          }
        } catch (error) {
          console.error("❌ Erro Google OAuth:", error);
          token.backendJwt = `mock-jwt-google-error-${Date.now()}`;
        }
      }
      
      // Para login com email/senha
      if (user?.backendJwt) {
        console.log("✅ Usando JWT do backend");
        token.backendJwt = user.backendJwt;
      }
      
      return token;
    },
    async session({ session, token }) {
      (session as any).backendJwt = token.backendJwt;
      console.log("🎫 Sessão configurada com JWT:", !!token.backendJwt);
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Usar NEXTAUTH_URL se disponível, senão usar baseUrl
      const redirectBase = process.env.NEXTAUTH_URL || baseUrl;
      
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
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };