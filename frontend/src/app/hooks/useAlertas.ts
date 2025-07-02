"use client";
import { useAuth } from "../providers/AuthProvider";
import { useState, useEffect } from "react";

export interface Alerta {
  id: number;
  preco_alvo: number;
  enviado: boolean;
  criado_em: string;
}

export function useAlertas() {
  const { backendJwt } = useAuth();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchAlertas() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/alertas/`, {
        headers: {
          Authorization: `Bearer ${backendJwt}`,
        },
      });
      if (!res.ok) throw new Error("Erro ao buscar alertas");
      const data = await res.json();
      setAlertas(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (backendJwt) fetchAlertas();
  }, [backendJwt]);

  return { alertas, loading, error, refetch: fetchAlertas };
} 