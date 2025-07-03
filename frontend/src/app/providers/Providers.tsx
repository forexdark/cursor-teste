"use client";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "./AuthProvider";
import Header from "../components/Header";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <Header />
        {children}
      </AuthProvider>
    </SessionProvider>
  );
}