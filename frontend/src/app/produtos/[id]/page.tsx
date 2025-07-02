"use client";
import { useParams } from "next/navigation";
import { useHistorico } from "../../hooks/useHistorico";
import { useResumoAvaliacao } from "../../hooks/useResumoAvaliacao";
import { useState } from "react";
import { LucideRefreshCw, LucideSparkles } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import ProtectedRoute from "../../components/ProtectedRoute";
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function ProdutoDetalhe() {
  const params = useParams();
  const produtoId = Number(params.id);
  const { historico, loading, error, fetchHistorico } = useHistorico(produtoId);
  const { resumo, loading: loadingResumo, fetchResumo } = useResumoAvaliacao(produtoId);
  const [showResumo, setShowResumo] = useState(false);

  const data = {
    labels: historico.map((h) => new Date(h.data).toLocaleDateString()),
    datasets: [
      {
        label: "Preço (R$)",
        data: historico.map((h) => h.preco),
        borderColor: "#2563eb",
        backgroundColor: "#93c5fd",
        tension: 0.3,
      },
    ],
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 p-4">
        <div className="max-w-3xl mx-auto py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-blue-900">Detalhes do Produto</h1>
            <button onClick={fetchHistorico} className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-semibold transition">
              <LucideRefreshCw size={18} /> Atualizar Histórico
            </button>
          </div>
          {loading && <div className="text-blue-700">Carregando histórico...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {historico.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <Line data={data} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <button
              className="flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2 rounded-lg font-semibold transition"
              onClick={() => {
                setShowResumo(true);
                fetchResumo();
              }}
              disabled={loadingResumo}
            >
              <LucideSparkles size={18} /> Gerar Resumo IA
            </button>
            {showResumo && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex-1">
                {loadingResumo ? "Gerando resumo..." : resumo}
              </div>
            )}
          </div>
          {/* Aqui pode-se adicionar a listagem e criação de alertas do produto */}
        </div>
      </main>
    </ProtectedRoute>
  );
} 