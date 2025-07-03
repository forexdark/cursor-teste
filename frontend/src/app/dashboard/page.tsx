"use client";
import Link from "next/link";
import { useProdutos } from "../hooks/useProdutos";
import { LucidePlus, LucideRefreshCw } from "lucide-react";
import ProtectedRoute from "../components/ProtectedRoute";

export default function Dashboard() {
  const { produtos, loading, error, refetch } = useProdutos();

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 p-4">
        <div className="max-w-5xl mx-auto py-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl font-bold text-blue-900">Meus Produtos Monitorados</h1>
            <div className="flex gap-2">
              <button onClick={refetch} className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-semibold transition">
                <LucideRefreshCw size={18} /> Atualizar
              </button>
              <Link href="/adicionar-produto" className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold transition">
                <LucidePlus size={18} /> Adicionar Produto
              </Link>
            </div>
          </div>
          {loading && <div className="text-blue-700">Carregando produtos...</div>}
          {error && <div className="text-red-600">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {produtos.map((produto) => (
              <Link
                href={`/produtos/${produto.id}`}
                key={produto.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg p-6 flex flex-col gap-2 border border-blue-100 hover:border-blue-300 transition group"
              >
                <span className="text-lg font-bold text-blue-800 group-hover:text-blue-900 transition">{produto.nome}</span>
                <span className="text-gray-600 text-sm truncate">{produto.url}</span>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-2xl font-bold text-blue-700">R$ {produto.preco_atual.toFixed(2)}</span>
                  <span className="text-xs text-gray-500">Estoque: {produto.estoque_atual}</span>
                </div>
                <span className="text-xs text-gray-400 mt-2">Adicionado em {new Date(produto.criado_em).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
          {produtos.length === 0 && !loading && (
            <div className="text-center text-gray-500 mt-12">Nenhum produto monitorado ainda.</div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
} 