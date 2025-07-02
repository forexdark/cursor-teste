"use client";
import { useAuth } from "../providers/AuthProvider";
import { useState } from "react";
import { LucideSearch, LucideCheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdicionarProduto() {
  const { backendJwt } = useAuth();
  const [query, setQuery] = useState("");
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function buscarSugestoes(q: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      setSugestoes(data.results || []);
    } catch (e: any) {
      setError("Erro ao buscar sugestões");
    } finally {
      setLoading(false);
    }
  }

  async function adicionarProduto() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/produtos/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${backendJwt}`,
        },
        body: JSON.stringify({
          ml_id: selected.id,
          nome: selected.title,
          url: selected.permalink,
        }),
      });
      if (!res.ok) throw new Error("Erro ao adicionar produto");
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">Adicionar Produto</h1>
        <div className="w-full mb-4 relative">
          <div className="flex items-center border border-blue-200 rounded-lg px-3 py-2 bg-blue-50">
            <LucideSearch className="text-blue-400 mr-2" size={20} />
            <input
              className="flex-1 bg-transparent outline-none text-blue-900"
              type="text"
              placeholder="Busque pelo nome do produto no Mercado Livre..."
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                if (e.target.value.length > 2) buscarSugestoes(e.target.value);
                else setSugestoes([]);
              }}
            />
          </div>
          {sugestoes.length > 0 && (
            <ul className="absolute z-10 left-0 right-0 bg-white border border-blue-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
              {sugestoes.map((s) => (
                <li
                  key={s.id}
                  className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${selected?.id === s.id ? "bg-blue-100" : ""}`}
                  onClick={() => setSelected(s)}
                >
                  <span className="font-semibold text-blue-800">{s.title}</span>
                  <span className="block text-xs text-gray-500">{s.price ? `R$ ${s.price}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {selected && (
          <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex flex-col gap-1">
            <span className="font-bold text-blue-800">{selected.title}</span>
            <span className="text-xs text-gray-500">ID: {selected.id}</span>
            <span className="text-xs text-gray-500">{selected.permalink}</span>
          </div>
        )}
        <button
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg transition mt-2 disabled:opacity-50"
          onClick={adicionarProduto}
          disabled={!selected || loading}
        >
          {loading ? "Adicionando..." : "Adicionar Produto"}
        </button>
        {success && (
          <div className="flex items-center gap-2 text-green-700 mt-4"><LucideCheckCircle /> Produto adicionado!</div>
        )}
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </div>
    </main>
  );
} 