"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";

export interface Produto {
  id: number;
  ml_id: string;
  nome: string;
  url: string;
  preco_atual: number;
  estoque_atual: number;
  criado_em: string;
}

export function useProdutos() {
  const { backendJwt } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchProdutos() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/produtos/`, {
        headers: {
          Authorization: `Bearer ${backendJwt}`,
        },
      });
      if (!res.ok) throw new Error("Erro ao buscar produtos");
      const data = await res.json();
      setProdutos(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (backendJwt) {
      fetchProdutos();
    }
  }, [backendJwt]);

  return { produtos, loading, error, refetch: fetchProdutos };
} 