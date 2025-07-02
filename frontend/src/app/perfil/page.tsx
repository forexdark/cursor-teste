"use client";
import { useSession, signOut } from "next-auth/react";
import { LucideLogOut } from "lucide-react";
import ProtectedRoute from "../components/ProtectedRoute";

export default function Perfil() {
  const { data: session } = useSession();

  return (
    <ProtectedRoute>
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
          <h1 className="text-2xl font-bold text-blue-900 mb-4">Meu Perfil</h1>
          <div className="w-full mb-6">
            <span className="block text-blue-800 font-semibold">Email:</span>
            <span className="block text-gray-700">{session?.user?.email}</span>
          </div>
          <button
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LucideLogOut size={20} /> Sair
          </button>
        </div>
      </main>
    </ProtectedRoute>
  );
} 