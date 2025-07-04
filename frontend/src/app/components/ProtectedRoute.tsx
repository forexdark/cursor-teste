"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const sessionData = useSession();
  const status = sessionData?.status || "unauthenticated";
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="flex justify-center items-center min-h-screen text-blue-700">Carregando...</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}