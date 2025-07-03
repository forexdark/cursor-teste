"use client";
import { useParams } from "next/navigation";
import { useHistorico } from "../../hooks/useHistorico";
import { useResumoAvaliacao } from "../../hooks/useResumoAvaliacao";
import { useState, useEffect } from "react";
import { 
  LucideRefreshCw, 
  LucideSparkles, 
  LucideExternalLink, 
  LucideBell, 
  LucideTrash2, 
  LucideBarChart,
  LucideTrendingUp,
  LucideTrendingDown,
  LucideEye,
  LucideShoppingCart,
  LucidePercent
} from "lucide-react";
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
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../providers/AuthProvider";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

interface Produto {
  id: number;
  ml_id: string;
  nome: string;
  url: string;
  preco_atual: number;
  estoque_atual: number;
  criado_em: string;
}

interface Alerta {
  id: number;
  preco_alvo: number;
  enviado: boolean;
  criado_em: string;
}

export default function ProdutoDetalhe() {
  const params = useParams();
  const produtoId = Number(params.id);
  const { backendJwt } = useAuth();
  const { historico, loading: loadingHistorico, error, fetchHistorico } = useHistorico(produtoId);
  const { resumo, loading: loadingResumo, fetchResumo } = useResumoAvaliacao(produtoId);
  
  const [produto, setProduto] = useState<Produto | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [showResumo, setShowResumo] = useState(false);
  const [novoAlerta, setNovoAlerta] = useState("");
  const [loadingProduto, setLoadingProduto] = useState(true);
  const [loadingAlerta, setLoadingAlerta] = useState(false);
  const [atualizandoProduto, setAtualizandoProduto] = useState(false);

  // Fetch product details
  useEffect(() => {
    fetchProdutoDetalhes();
    fetchAlertas();
    fetchHistorico();
  }, [produtoId]);

  const fetchProdutoDetalhes = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/produtos/`, {
        headers: { Authorization: `Bearer ${backendJwt}` },
      });
      const produtos = await res.json();
      const produtoEncontrado = produtos.find((p: Produto) => p.id === produtoId);
      setProduto(produtoEncontrado || null);
    } catch (err) {
      console.error("Erro ao buscar produto:", err);
    } finally {
      setLoadingProduto(false);
    }
  };

  const fetchAlertas = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/alertas/`, {
        headers: { Authorization: `Bearer ${backendJwt}` },
      });
      const todosAlertas = await res.json();
      const alertasDoProduto = todosAlertas.filter((a: any) => a.produto_id === produtoId);
      setAlertas(alertasDoProduto);
    } catch (err) {
      console.error("Erro ao buscar alertas:", err);
    }
  };

  const atualizarProdutoML = async () => {
    setAtualizandoProduto(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/produtos/${produtoId}/atualizar`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${backendJwt}` },
      });
      if (res.ok) {
        await fetchProdutoDetalhes();
        await fetchHistorico();
      }
    } catch (err) {
      console.error("Erro ao atualizar produto:", err);
    } finally {
      setAtualizandoProduto(false);
    }
  };

  const criarAlerta = async () => {
    if (!novoAlerta || parseFloat(novoAlerta) <= 0) return;
    
    setLoadingAlerta(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/alertas/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${backendJwt}`,
        },
        body: JSON.stringify({
          produto_id: produtoId,
          preco_alvo: parseFloat(novoAlerta),
        }),
      });
      if (res.ok) {
        setNovoAlerta("");
        await fetchAlertas();
      }
    } catch (err) {
      console.error("Erro ao criar alerta:", err);
    } finally {
      setLoadingAlerta(false);
    }
  };

  const removerAlerta = async (alertaId: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/alertas/${alertaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${backendJwt}` },
      });
      if (res.ok) {
        await fetchAlertas();
      }
    } catch (err) {
      console.error("Erro ao remover alerta:", err);
    }
  };

  // Chart data
  const chartData = {
    labels: historico.map((h) => new Date(h.data).toLocaleDateString('pt-BR')),
    datasets: [
      {
        label: "Preço (R$)",
        data: historico.map((h) => h.preco),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        tension: 0.3,
        fill: true,
        pointBackgroundColor: "#2563eb",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#2563eb',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `Preço: R$ ${context.parsed.y.toFixed(2)}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return `R$ ${value.toFixed(2)}`;
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  // Calculate stats
  const precoMin = historico.length > 0 ? Math.min(...historico.map(h => h.preco)) : 0;
  const precoMax = historico.length > 0 ? Math.max(...historico.map(h => h.preco)) : 0;
  const precoMedio = historico.length > 0 ? historico.reduce((sum, h) => sum + h.preco, 0) / historico.length : 0;
  const variacao = precoMax > 0 ? ((produto?.preco_atual || 0) - precoMedio) / precoMedio * 100 : 0;

  if (loadingProduto) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/50 flex items-center justify-center">
          <div className="text-center">
            <LucideRefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Carregando produto...</p>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  if (!produto) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/50 flex items-center justify-center">
          <Card className="text-center p-8">
            <CardContent>
              <h1 className="text-xl font-bold text-gray-800 mb-2">Produto não encontrado</h1>
              <p className="text-gray-600">O produto que você está procurando não existe.</p>
            </CardContent>
          </Card>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2 line-clamp-2">
                  {produto.nome}
                </h1>
                <p className="text-gray-600">
                  ID: {produto.ml_id} • Monitorado desde {new Date(produto.criado_em).toLocaleDateString('pt-BR')}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={atualizarProdutoML}
                  disabled={atualizandoProduto}
                  className="group"
                >
                  <LucideRefreshCw 
                    size={18} 
                    className={`mr-2 ${atualizandoProduto ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} 
                  />
                  {atualizandoProduto ? 'Atualizando...' : 'Atualizar Dados'}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => window.open(produto.url, '_blank')}
                >
                  <LucideExternalLink size={18} className="mr-2" />
                  Ver no ML
                </Button>
              </div>
            </div>

            {/* Current Price & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Preço Atual
                    </CardTitle>
                    <LucideShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">
                    R$ {produto.preco_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {variacao >= 0 ? (
                      <LucideTrendingUp className="w-4 h-4 text-red-500" />
                    ) : (
                      <LucideTrendingDown className="w-4 h-4 text-green-500" />
                    )}
                    <span className={`text-sm font-medium ${variacao >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Menor Preço
                    </CardTitle>
                    <LucideTrendingDown className="w-5 h-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">
                    R$ {precoMin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <Badge variant="success" className="mt-2">
                    Histórico
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Preço Médio
                    </CardTitle>
                    <LucideBarChart className="w-5 h-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-700">
                    R$ {precoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <Badge variant="outline" className="mt-2">
                    Últimos 30 dias
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Estoque
                    </CardTitle>
                    <LucideEye className="w-5 h-5 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-700">
                    {produto.estoque_atual}
                  </div>
                  <Badge variant={produto.estoque_atual > 0 ? "success" : "destructive"} className="mt-2">
                    {produto.estoque_atual > 0 ? 'Disponível' : 'Sem estoque'}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Price Chart */}
            {historico.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <LucideBarChart className="w-5 h-5" />
                        Histórico de Preços
                      </CardTitle>
                      <CardDescription>
                        Acompanhe a evolução do preço ao longo do tempo
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchHistorico}
                      disabled={loadingHistorico}
                    >
                      <LucideRefreshCw 
                        size={16} 
                        className={loadingHistorico ? 'animate-spin' : ''} 
                      />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alerts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create Alert */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LucideBell className="w-5 h-5" />
                    Criar Alerta de Preço
                  </CardTitle>
                  <CardDescription>
                    Receba uma notificação quando o preço atingir o valor desejado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preço alvo (R$)
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="input-high-contrast flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          placeholder="Ex: 299.90"
                          value={novoAlerta}
                          onChange={(e) => setNovoAlerta(e.target.value)}
                        />
                        <Button
                          onClick={criarAlerta}
                          disabled={loadingAlerta || !novoAlerta}
                        >
                          {loadingAlerta ? "Criando..." : "Criar"}
                        </Button>
                      </div>
                    </div>
                    
                    {produto.preco_atual > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          💡 <strong>Dica:</strong> O preço atual é R$ {produto.preco_atual.toFixed(2)}. 
                          Defina um valor menor para ser notificado quando houver desconto.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Active Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LucideBell className="w-5 h-5" />
                    Alertas Ativos ({alertas.length})
                  </CardTitle>
                  <CardDescription>
                    Seus alertas configurados para este produto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alertas.length > 0 ? (
                      alertas.map((alerta) => (
                        <div key={alerta.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-semibold text-gray-800">
                              R$ {alerta.preco_alvo.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Criado em {new Date(alerta.criado_em).toLocaleDateString('pt-BR')}
                            </div>
                            {alerta.enviado && (
                              <Badge variant="success" className="mt-1 text-xs">
                                Notificação enviada
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removerAlerta(alerta.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <LucideTrash2 size={16} />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <LucideBell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum alerta configurado</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LucideSparkles className="w-5 h-5" />
                  Análise Inteligente com IA
                </CardTitle>
                <CardDescription>
                  Resumo automático das avaliações dos compradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!showResumo ? (
                    <Button
                      onClick={() => {
                        setShowResumo(true);
                        fetchResumo();
                      }}
                      disabled={loadingResumo}
                      className="group"
                    >
                      <LucideSparkles className="mr-2 w-4 h-4 group-hover:scale-110 transition-transform" />
                      {loadingResumo ? "Gerando resumo..." : "Gerar Resumo das Avaliações"}
                    </Button>
                  ) : (
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
                      {loadingResumo ? (
                        <div className="flex items-center gap-3">
                          <LucideRefreshCw className="w-5 h-5 animate-spin text-yellow-600" />
                          <span className="text-yellow-800">Analisando avaliações com IA...</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <LucideSparkles className="w-5 h-5 text-yellow-600" />
                            <span className="font-semibold text-yellow-800">Resumo Inteligente</span>
                          </div>
                          <p className="text-yellow-900 leading-relaxed">
                            {resumo || "Não foi possível gerar o resumo. Tente novamente mais tarde."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-sm">!</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-800">Erro ao carregar dados</h3>
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}