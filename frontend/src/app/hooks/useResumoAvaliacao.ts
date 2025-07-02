"use client";
import { useAuth } from "../providers/AuthProvider";
import { useState } from "react";

export function useResumoAvaliacao(produtoId: number) {
  const { backendJwt } = useAuth();
  const [resumo, setResumo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchResumo() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/produtos/${produtoId}/resumo_avaliacoes`, {
        headers: {
          Authorization: `Bearer ${backendJwt}`,
        },
      });
      if (!res.ok) throw new Error("Erro ao buscar resumo de avaliações");
      const data = await res.json();
      setResumo(data.resumo);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return { resumo, loading, error, fetchResumo };
} 