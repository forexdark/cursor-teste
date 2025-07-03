"use client";
import Link from "next/link";
import { useProdutos } from "../hooks/useProdutos";
import { LucidePlus, LucideRefreshCw, LucideTrendingUp, LucideTrendingDown, LucideEye, LucideExternalLink, LucidePackage, LucideSparkles, LucideBrain, LucideGift, LucideBell, LucideZap, LucideHeart, LucideStar, LucideTarget, LucideRocket, LucideCrown, LucideFlame } from "lucide-react";
import { FaShoppingCart } from "react-icons/fa";
import ProtectedRoute from "../components/ProtectedRoute";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { useState, useEffect } from "react";

export default function Inicio() {
  const { produtos, loading, error, refetch } = useProdutos();
  const [insights, setInsights] = useState<string[]>([]);
  const [cupons, setCupons] = useState<any[]>([]);
  const [novidades, setNovidades] = useState<any[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const totalValue = produtos.reduce((sum, p) => sum + p.preco_atual, 0);
  const averagePrice = produtos.length > 0 ? totalValue / produtos.length : 0;

  // Simular insights de IA e cupons
  useEffect(() => {
    gerarInsightsIA();
    buscarCuponsDisponiveis();
    carregarNovidades();
  }, [produtos]);

  const gerarInsightsIA = async () => {
    setLoadingInsights(true);
    
    // Simular delay da IA
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const insightsIA = [
      "📈 Seus produtos favoritos estão 12% mais baratos que na semana passada",
      "🎯 iPhone 15: preço ideal para compra é R$ 3.200 (atual: R$ 3.450)",
      "⚡ PlayStation 5: histórico mostra que terça-feira tem os melhores preços",
      "💡 MacBook Air: 3 lojas oferecem frete grátis e parcelamento sem juros",
      "🔥 Samsung Galaxy: detectamos promoção relâmpago em 2 horas"
    ];

    setInsights(insightsIA.slice(0, 3));
    setLoadingInsights(false);
  };

  const buscarCuponsDisponiveis = () => {
    const cuponsSimulados = [
      {
        id: 1,
        codigo: "TECH15",
        descricao: "15% OFF em Eletrônicos",
        desconto: "15%",
        validade: "Válido até 31/12",
        categoria: "Eletrônicos",
        cor: "from-blue-500 to-blue-600"
      },
      {
        id: 2,
        codigo: "FRETE10",
        descricao: "Frete Grátis + 10% OFF",
        desconto: "10% + Frete",
        validade: "Válido até amanhã",
        categoria: "Geral",
        cor: "from-green-500 to-green-600"
      },
      {
        id: 3,
        codigo: "BLACKFRI",
        descricao: "Black Friday Antecipada",
        desconto: "Até 50%",
        validade: "Últimas horas",
        categoria: "Moda",
        cor: "from-purple-500 to-purple-600"
      }
    ];
    setCupons(cuponsSimulados);
  };

  const carregarNovidades = () => {
    const novidadesPlataforma = [
      {
        id: 1,
        titulo: "🚀 Alertas por WhatsApp disponíveis!",
        descricao: "Agora você pode receber notificações diretamente no seu WhatsApp",
        data: "Hoje",
        tipo: "feature",
        cor: "from-green-500 to-green-600"
      },
      {
        id: 2,
        titulo: "🧠 IA melhorada para análise de preços",
        descricao: "Nossa inteligência artificial ficou 40% mais precisa",
        data: "2 dias atrás",
        tipo: "update",
        cor: "from-blue-500 to-blue-600"
      },
      {
        id: 3,
        titulo: "📊 Novo dashboard de estatísticas",
        descricao: "Acompanhe sua economia com gráficos detalhados",
        data: "1 semana atrás",
        tipo: "feature",
        cor: "from-purple-500 to-purple-600"
      }
    ];
    setNovidades(novidadesPlataforma);
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                      <FaShoppingCart className="text-white text-lg" />
                    </div>
                    Bem-vindo ao VigIA
                  </h1>
                  <p className="text-gray-600">
                    Acompanhe seus produtos monitorados e economize dinheiro
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={refetch}
                    disabled={loading}
                    className="group"
                  >
                    <LucideRefreshCw 
                      size={18} 
                      className={`mr-2 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} 
                    />
                    {loading ? 'Atualizando...' : 'Atualizar Preços'}
                  </Button>
                  
                  <Link href="/adicionar-produto">
                    <Button className="w-full sm:w-auto group">
                      <LucidePlus size={18} className="mr-2 group-hover:scale-110 transition-transform" />
                      Adicionar Produto
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total de Produtos
                    </CardTitle>
                    <LucidePackage className="w-5 h-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">{produtos.length}</div>
                  <Badge variant="secondary" className="mt-2">
                    Monitorados ativamente
                  </Badge>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Valor Total
                    </CardTitle>
                    <FaShoppingCart className="w-5 h-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">
                    R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <Badge variant="success" className="mt-2">
                    Valor atual do portfólio
                  </Badge>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Preço Médio
                    </CardTitle>
                    <LucideTrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">
                    R$ {averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <Badge variant="outline" className="mt-2">
                    Média dos produtos
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Insights IA, Cupons e Novidades */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              
              {/* Insights IA */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <LucideBrain className="w-5 h-5" />
                    Insights IA
                  </CardTitle>
                  <CardDescription className="text-blue-600">
                    Análise inteligente dos seus produtos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingInsights ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-blue-200 rounded w-full mb-2"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {insights.map((insight, index) => (
                        <div key={index} className="p-3 bg-white rounded-lg shadow-sm border border-blue-200">
                          <p className="text-sm text-gray-700">{insight}</p>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3 border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={gerarInsightsIA}
                      >
                        <LucideSparkles className="w-4 h-4 mr-2" />
                        Atualizar Insights
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cupons Disponíveis */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <LucideGift className="w-5 h-5" />
                    Cupons Ativos
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    Descontos exclusivos para você
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cupons.map((cupom) => (
                      <div key={cupom.id} className={`p-3 bg-gradient-to-r ${cupom.cor} rounded-lg text-white`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm">{cupom.codigo}</span>
                          <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/20">
                            {cupom.desconto}
                          </Badge>
                        </div>
                        <p className="text-xs text-white/90">{cupom.descricao}</p>
                        <p className="text-xs text-white/70 mt-1">{cupom.validade}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Novidades da Plataforma */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <LucideRocket className="w-5 h-5" />
                    Novidades
                  </CardTitle>
                  <CardDescription className="text-purple-600">
                    Últimas atualizações da plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {novidades.map((novidade) => (
                      <div key={novidade.id} className="p-3 bg-white rounded-lg shadow-sm border border-purple-200">
                        <h4 className="font-semibold text-sm text-gray-800 mb-1">{novidade.titulo}</h4>
                        <p className="text-xs text-gray-600 mb-2">{novidade.descricao}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-purple-600">{novidade.data}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs bg-gradient-to-r ${novidade.cor} text-white border-0`}
                          >
                            {novidade.tipo === 'feature' ? 'Novo' : 'Update'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Avisos Recentes */}
            <Card className="mb-8 border-0 shadow-xl bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <LucideBell className="w-5 h-5" />
                  Avisos Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <LucideFlame className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">Promoção Relâmpago!</h4>
                      <p className="text-gray-600 text-xs">iPhone 15 com 20% de desconto por tempo limitado</p>
                      <span className="text-xs text-red-600 font-medium">Termina em 2h 15min</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <LucideZap className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">Meta de Economia Atingida!</h4>
                      <p className="text-gray-600 text-xs">Você economizou R$ 450 este mês</p>
                      <span className="text-xs text-green-600 font-medium">Parabéns! 🎉</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error State */}
            {error && (
              <Card className="mb-8 border-red-200 bg-red-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-sm">!</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-800">Erro ao carregar produtos</h3>
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products Grid */}
            {produtos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {produtos.map((produto) => (
                  <Card key={produto.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-blue-700 transition-colors">
                            {produto.nome}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            ID: {produto.ml_id}
                          </CardDescription>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          <Badge 
                            variant={produto.estoque_atual > 0 ? "success" : "destructive"}
                            className="text-xs"
                          >
                            {produto.estoque_atual > 0 ? `${produto.estoque_atual} em estoque` : 'Sem estoque'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        {/* Price */}
                        <div>
                          <div className="text-2xl font-bold text-blue-700 mb-1">
                            R$ {produto.preco_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-gray-500">
                            Adicionado em {new Date(produto.criado_em).toLocaleDateString('pt-BR')}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Link href={`/produtos/${produto.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full group">
                              <LucideEye size={14} className="mr-1 group-hover:scale-110 transition-transform" />
                              Detalhes
                            </Button>
                          </Link>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(produto.url, '_blank')}
                            className="px-3"
                          >
                            <LucideExternalLink size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              !loading && (
                <Card className="text-center py-12 border-0 shadow-xl">
                  <CardContent>
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LucidePackage className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Nenhum produto monitorado
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Comece adicionando produtos do Mercado Livre para monitorar preços automaticamente
                      </p>
                      <Link href="/adicionar-produto">
                        <Button className="group">
                          <LucidePlus size={18} className="mr-2 group-hover:scale-110 transition-transform" />
                          Adicionar Primeiro Produto
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            )}

            {/* Loading State */}
            {loading && produtos.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse border-0 shadow-lg">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-gray-200 rounded flex-1"></div>
                        <div className="h-8 bg-gray-200 rounded w-12"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}