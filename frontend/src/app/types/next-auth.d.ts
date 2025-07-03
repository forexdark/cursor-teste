import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    backendJwt?: string;
  }
  interface User {
    backendJwt?: string;
  }
}