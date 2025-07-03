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
          return null;
        }

        try {
          // Tentar fazer login no backend
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              senha: credentials.password,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            return {
              id: "1",
              email: credentials.email,
              name: credentials.email.split('@')[0],
              backendJwt: data.access_token,
            };
          }
        } catch (error) {
          console.error("Erro na autenticação:", error);
        }
        
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // Para Google OAuth
      if (account && profile?.email) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token_id: account.id_token }),
          });
          if (res.ok) {
            const data = await res.json();
            token.backendJwt = data.access_token;
          }
        } catch (error) {
          console.error("Erro ao integrar com backend Google:", error);
        }
      }
      
      // Para login com email/senha
      if (user?.backendJwt) {
        token.backendJwt = user.backendJwt;
      }
      
      return token;
    },
    async session({ session, token }) {
      (session as any).backendJwt = token.backendJwt;
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/") && !url.startsWith("//")) {
        return `${baseUrl}${url}`;
      } else if (url.startsWith(baseUrl)) {
        return url;
      }
      return `${baseUrl}/dashboard`;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };