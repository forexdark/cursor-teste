"use client";
import { useAlertas } from "../hooks/useAlertas";
import { LucideTrash2 } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";

export default function Alertas() {
  const { alertas, loading, error, refetch } = useAlertas();
  const { backendJwt } = useAuth();
  const [removendo, setRemovendo] = useState<number | null>(null);

  async function removerAlerta(id: number) {
    setRemovendo(id);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/alertas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${backendJwt}` },
      });
      refetch();
    } finally {
      setRemovendo(null);
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 p-4">
        <div className="max-w-2xl mx-auto py-8">
          <h1 className="text-2xl font-bold text-blue-900 mb-6">Meus Alertas</h1>
          {loading && <div className="text-blue-700">Carregando alertas...</div>}
          {error && <div className="text-red-600">{error}</div>}
          <div className="flex flex-col gap-4">
            {alertas.map((alerta) => (
              <div key={alerta.id} className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between border border-blue-100">
                <div>
                  <span className="font-bold text-blue-800">Preço alvo: R$ {alerta.preco_alvo.toFixed(2)}</span>
                  <span className="block text-xs text-gray-500">Criado em {new Date(alerta.criado_em).toLocaleDateString()}</span>
                  {alerta.enviado && <span className="block text-xs text-green-600 font-semibold mt-1">Alerta já enviado</span>}
                </div>
                <button
                  className="text-red-600 hover:text-red-800 p-2 rounded-lg transition"
                  onClick={() => removerAlerta(alerta.id)}
                  disabled={removendo === alerta.id}
                  title="Remover alerta"
                >
                  <LucideTrash2 size={20} />
                </button>
              </div>
            ))}
          </div>
          {alertas.length === 0 && !loading && (
            <div className="text-center text-gray-500 mt-12">Nenhum alerta cadastrado ainda.</div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
} 