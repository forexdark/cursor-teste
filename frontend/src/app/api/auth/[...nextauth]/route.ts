import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Aqui você pode integrar com o backend para obter o JWT
      // Exemplo: fetch para /auth/google do backend
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
          console.error("Erro ao integrar com backend:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).backendJwt = token.backendJwt;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Sempre redirecionar para o dashboard após login bem-sucedido
      if (url.startsWith("/api/auth")) {
        return `${baseUrl}/dashboard`;
      }
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 