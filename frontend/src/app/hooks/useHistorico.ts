"use client";
import { useState } from "react";
import { useAuth } from "../providers/AuthProvider";

export interface HistoricoPreco {
  id: number;
  preco: number;
  estoque: number;
  data: string;
}

export function useHistorico(produtoId: number) {
  const { backendJwt } = useAuth();
  const [historico, setHistorico] = useState<HistoricoPreco[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchHistorico() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/produtos/${produtoId}/historico`, {
        headers: {
          Authorization: `Bearer ${backendJwt}`,
        },
      });
      if (!res.ok) throw new Error("Erro ao buscar histórico");
      const data = await res.json();
      setHistorico(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return { historico, loading, error, fetchHistorico };
} 