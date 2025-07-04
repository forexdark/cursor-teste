"use client";
import { useAuth } from "../providers/AuthProvider";
import { useState, useRef, useEffect } from "react";
import { LucideSearch, LucideCheckCircle, LucideX, LucideExternalLink, LucidePlus, LucideLoader, LucideShoppingCart, LucideStar, LucideFilter, LucideSparkles, LucideTrendingUp, LucideZap, LucideShield, LucideEye, LucidePackage } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import ProtectedRoute from "../components/ProtectedRoute";
import MLAuthButton from "../components/MLAuthButton";

interface ProdutoML {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  thumbnail: string;
  permalink: string;
  condition: string;
  shipping?: {
    free_shipping: boolean;
    logistic_type?: string;
  };
  seller?: {
    id: number;
    nickname: string;
    permalink: string;
    reputation?: {
      level_id: string;
      power_seller_status: string;
      transactions: {
        completed: number;
        canceled: number;
        period: string;
      };
    };
  };
  reviews?: {
    rating_average: number;
    total: number;
  };
  category_id?: string;
  available_quantity?: number;
  sold_quantity?: number;
  currency_id: string;
  location?: {
    state: {
      name: string;
    };
    city: {
      name: string;
    };
  };
  installments?: {
    quantity: number;
    amount: number;
    rate: number;
  };
  attributes?: Array<{
    id: string;
    name: string;
    value_name: string;
  }>;
}

const produtosSugeridos = [
  "iPhone 15", "MacBook Air", "Samsung Galaxy", "PlayStation 5", "Xbox Series X",
  "Nike Air Max", "Adidas Ultraboost", "Notebook Dell", "Smart TV 55'", "AirPods Pro",
  "Cafeteira Nespresso", "Aspirador Robô", "Monitor Gamer", "Mouse Gamer", "Teclado Mecânico"
];

export default function AdicionarProduto() {
  const { backendJwt } = useAuth();
  const [query, setQuery] = useState("");
  const [sugestoes, setSugestoes] = useState<ProdutoML[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ProdutoML | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Função para buscar produtos reais do Mercado Livre
  async function buscarSugestoes(q: string) {
    if (q.length < 2) {
      setSugestoes([]);
      setShowSuggestions(false);
      setSearchAttempted(false);
      return;
    }

    // Limpar estados anteriores
    setError(null);
    setLoading(true);
    setSearchAttempted(true);
    
    // Verificar se o usuário está autenticado
    if (!backendJwt) {
      setError("Você precisa estar logado para buscar produtos. Faça login novamente.");
      setLoading(false);
      return;
    }
    
    try {
      console.log(`🔍 Iniciando busca: "${q}"`);
      
      // Tentar busca detalhada primeiro, depois simples
      const searchUrls = [
        `${process.env.NEXT_PUBLIC_API_URL}/produtos/search-enhanced/${encodeURIComponent(q.trim())}`,
        `${process.env.NEXT_PUBLIC_API_URL}/produtos/search/${encodeURIComponent(q.trim())}`
      ];
      
      let searchUrl = searchUrls[0]; // Começar com busca detalhada
      console.log(`📡 URL de busca: ${searchUrl}`);
      
      // Controller para timeout
      let controller = new AbortController();
      let timeoutId = setTimeout(() => controller.abort(), 20000); // 20 segundos para busca detalhada
      
      try {
        let response = await fetch(searchUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${backendJwt}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Se busca detalhada falhou, tentar busca simples
        if (!response.ok && searchUrl === searchUrls[0]) {
          console.log("⚠️ Busca detalhada falhou, tentando busca simples...");
          
          controller = new AbortController();
          timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos para busca simples
          
          searchUrl = searchUrls[1];
          
          response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${backendJwt}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
        }
        
        console.log(`📊 Status da resposta: ${response.status}`);
        
        // Log adicional para debug
        if (process.env.NODE_ENV === 'development') {
          const responseClone = response.clone();
          const debugText = await responseClone.text();
          console.log(`🔍 Response body preview:`, debugText.substring(0, 300));
        }
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Erro desconhecido');
          console.error(`❌ Erro HTTP ${response.status}: ${errorText}`);
          
          if (response.status === 401) {
            setError("Sessão expirada. Faça login novamente.");
          } else if (response.status === 404) {
            setError("Nenhum produto encontrado para este termo.");
          } else if (response.status === 504) {
            setError("Busca muito lenta. Tente novamente com um termo mais específico.");
          } else {
            setError(`Erro na busca (${response.status}). Tente novamente.`);
          }
          setSugestoes([]);
          setShowSuggestions(true);
          return;
        }
        
        // Parse da resposta JSON
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("❌ Erro ao fazer parse da resposta:", parseError);
          setError("Resposta inválida do servidor. Tente novamente.");
          setSugestoes([]);
          setShowSuggestions(true);
          return;
        }
        
        console.log(`📋 Dados recebidos:`, data);
        
        // Verificar se a busca foi bem-sucedida
        if (!data.success) {
          const errorMsg = data.error || data.message || "Erro na busca autenticada";
          console.warn(`⚠️ Busca não bem-sucedida: ${errorMsg}`);
          
          // Verificar se é erro de autorização
          if (data.action_required === 'oauth_authorization') {
            setError("⚠️ Autorização do Mercado Livre necessária! Clique em 'Autorizar ML' acima para buscar produtos reais.");
          } else if (data.action_required === 'check_authorization') {
            setError("⚠️ Erro na sua autorização do Mercado Livre. Tente revogar e autorizar novamente.");
          } else {
            // Mostrar erro detalhado para outros casos
            let detailedError = errorMsg;
            if (data.user_id) {
              detailedError += ` (Usuário: ${data.user_id})`;
            }
            if (data.message) {
              detailedError += ` - ${data.message}`;
            }
            setError(detailedError);
          }
          setSugestoes([]);
          setShowSuggestions(true);
          return;
        }
        
        // Extrair produtos
        const mlResponse = data.ml_response || {};
        const produtos = mlResponse.results || [];
        console.log(`📦 Produtos encontrados: ${produtos.length}`);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Resposta completa ML:`, mlResponse);
          console.log(`📊 Total disponível: ${mlResponse.paging?.total || 0}`);
          
          // Log mais detalhado para produtos
          if (produtos.length > 0) {
            console.log(`📦 Primeiro produto:`, {
              id: produtos[0].id,
              title: produtos[0].title?.substring(0, 50),
              price: produtos[0].price,
              hasDetails: !!(produtos[0].seller?.nickname)
            });
          }
        }
        
        if (produtos.length > 0) {
          // Filtrar produtos válidos
          const produtosValidos = produtos.filter((produto: any) => 
            produto && 
            produto.id && 
            produto.title && 
            typeof produto.price === 'number'
          );
          
          // Ordenar por relevância
          const produtosOrdenados = produtosValidos
            .sort((a: ProdutoML, b: ProdutoML) => {
              const scoreA = (a.sold_quantity || 0) + (a.reviews?.total || 0);
              const scoreB = (b.sold_quantity || 0) + (b.reviews?.total || 0);
              return scoreB - scoreA;
            })
            .slice(0, 12);
            
          setSugestoes(produtosOrdenados);
          console.log(`✅ ${produtosOrdenados.length} produtos válidos carregados e exibidos`);
        } else {
          const noResultsMsg = data.message || "Nenhum produto encontrado para este termo.";
          setError(noResultsMsg);
          setSugestoes([]);
          console.log(`⚠️ Nenhum produto: ${noResultsMsg}`);
        }
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error("❌ Timeout na busca");
          setError("Busca muito lenta. Tente novamente com um termo mais específico.");
        } else {
          console.error("❌ Erro na requisição:", fetchError);
          setError("Erro de conexão. Verifique sua internet e tente novamente.");
        }
        setSugestoes([]);
      }

      setShowSuggestions(true);
      
    } catch (e: any) {
      console.error("❌ Erro na busca:", e);
      setError("Erro inesperado. Tente novamente em alguns momentos.");
      setSugestoes([]);
      setShowSuggestions(true);
    } finally {
      setLoading(false);
    }
  }

  // Dados de exemplo para desenvolvimento/demonstração
  function gerarDadosExemplo(query: string): ProdutoML[] {
    // Simulação mais realista baseada no termo de busca
    const baseProducts = [
      {
        id: "MLB" + Math.random().toString().substring(2, 11),
        title: `${query} - Modelo Mais Vendido 2024`,
        price: Math.floor(Math.random() * 2000) + 100,
        thumbnail: "https://http2.mlstatic.com/D_NQ_NP_2X_300x300.webp",
        permalink: "https://produto.mercadolivre.com.br/MLB-exemplo",
        condition: "new",
        currency_id: "BRL",
        shipping: { free_shipping: Math.random() > 0.3 },
        seller: {
          id: Math.floor(Math.random() * 100000),
          nickname: "VendedorOficial" + Math.floor(Math.random() * 1000),
          permalink: "https://perfil.mercadolivre.com.br/vendedor",
          reputation: {
            level_id: ["5_green", "4_light_green", "3_yellow"][Math.floor(Math.random() * 3)],
            power_seller_status: Math.random() > 0.5 ? "platinum" : "gold",
            transactions: {
              completed: Math.floor(Math.random() * 5000) + 100,
              canceled: Math.floor(Math.random() * 50),
              period: "60 days"
            }
          }
        },
        reviews: {
          rating_average: 3.5 + Math.random() * 1.5,
          total: Math.floor(Math.random() * 1000) + 50
        },
        available_quantity: Math.floor(Math.random() * 100) + 1,
        sold_quantity: Math.floor(Math.random() * 500) + 10
      }
    ];

    return baseProducts;
  }

  async function adicionarProduto() {
    if (!selected) return;
    
    if (!backendJwt) {
      setError("Você precisa estar logado para adicionar produtos. Faça login novamente.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Adicionando produto:", selected.id);
      console.log("Backend JWT:", backendJwt ? "Presente" : "Ausente");
      
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
      
      console.log("Response status:", res.status);
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erro HTTP ${res.status}: Não foi possível adicionar o produto`);
      }
      
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (e: any) {
      console.error("Erro ao adicionar produto:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const clearSelection = () => {
    setSelected(null);
    setQuery("");
    setSugestoes([]);
    setShowSuggestions(false);
    setSearchAttempted(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getConditionText = (condition: string) => {
    const conditions: { [key: string]: string } = {
      'new': 'Novo',
      'used': 'Usado',
      'refurbished': 'Recondicionado'
    };
    return conditions[condition] || condition;
  };

  const getReputationColor = (level: string) => {
    const colors: { [key: string]: string } = {
      '5_green': 'bg-green-100 text-green-800 border-green-200',
      '4_light_green': 'bg-green-50 text-green-700 border-green-200',
      '3_yellow': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      '2_orange': 'bg-orange-100 text-orange-800 border-orange-200',
      '1_red': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[level] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getReputationText = (level: string) => {
    const levels: { [key: string]: string } = {
      '5_green': 'Excelente',
      '4_light_green': 'Muito Bom',
      '3_yellow': 'Bom',
      '2_orange': 'Regular',
      '1_red': 'Ruim'
    };
    return levels[level] || 'N/A';
  };

  if (success) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-200 p-4">
          <Card className="max-w-md w-full p-8 text-center animate-bounce border-0 shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <LucideCheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-green-800 mb-3">Produto Adicionado!</h1>
            <p className="text-green-600 mb-4">🎉 Agora você receberá alertas sobre este produto.</p>
            <div className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <LucideLoader className="w-4 h-4 animate-spin" />
              Redirecionando para o dashboard...
            </div>
          </Card>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Header with Animation */}
            <div className="text-center mb-12 animate-fade-in">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full px-6 py-3 mb-6">
                <LucideSparkles className="w-6 h-6 text-white animate-pulse" />
                <span className="text-white font-semibold">Adicionar Produto</span>
                <LucideZap className="w-6 h-6 text-yellow-300 animate-bounce" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Encontre e Monitore Produtos
              </h1>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Pesquise produtos do Mercado Livre e receba alertas inteligentes quando o preço baixar
              </p>
            </div>

            {/* Search Section */}
            {/* ML Authorization Section */}
            <div className="mb-8">
              <MLAuthButton onAuthSuccess={() => {
                // Recarregar produtos quando autorização for bem-sucedida
                if (query) {
                  buscarSugestoes(query);
                }
              }} />
            </div>

            <Card className="mb-8 overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <LucideSearch className="w-5 h-5" />
                  </div>
                  Pesquisar Produto
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Digite o nome do produto que você quer monitorar
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Search Input */}
                  <div className="relative" ref={searchRef}>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                      <div className="relative">
                        <LucideSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                        <input
                          className="input-high-contrast w-full pl-12 pr-12 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-lg hover:border-blue-300"
                          type="text"
                          placeholder="Ex: iPhone 15, MacBook Air, PlayStation 5..."
                          value={query}
                          onChange={e => {
                            setQuery(e.target.value);
                            buscarSugestoes(e.target.value);
                          }}
                          onFocus={() => {
                            if (sugestoes.length > 0) setShowSuggestions(true);
                          }}
                        />
                        {loading && (
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                            <LucideLoader className="text-blue-500 w-6 h-6 animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Suggestions */}
                    {!query && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                          <LucideTrendingUp className="w-4 h-4" />
                          Sugestões populares:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {produtosSugeridos.slice(0, 8).map((produto, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setQuery(produto);
                                buscarSugestoes(produto);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 rounded-full text-sm font-medium text-gray-800 transition-all hover:scale-105 hover:shadow-md"
                            >
                              {produto}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Enhanced Suggestions Dropdown */}
                    {showSuggestions && sugestoes.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 bg-white/95 backdrop-blur-lg border border-gray-200 rounded-2xl mt-3 shadow-2xl max-h-96 overflow-y-auto">
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-3 px-3">
                            <span className="text-sm font-semibold text-gray-800">
                              {sugestoes.length} produtos encontrados
                            </span>
                            <LucideTrendingUp className="w-4 h-4 text-green-500" />
                          </div>
                          {sugestoes.map((produto) => (
                            <div
                              key={produto.id}
                              className={`p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:scale-[1.02] hover:shadow-md group ${
                                selected?.id === produto.id ? "bg-gradient-to-r from-blue-100 to-purple-100 ring-2 ring-blue-300" : ""
                              }`}
                              onClick={() => {
                                setSelected(produto);
                                setQuery(produto.title);
                                setShowSuggestions(false);
                              }}
                            >
                              <div className="flex items-start gap-4">
                                <div className="relative">
                                  <img
                                    src={produto.thumbnail}
                                    alt={produto.title}
                                    className="w-16 h-16 object-cover rounded-xl group-hover:scale-110 transition-transform"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x100?text=Produto';
                                    }}
                                  />
                                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <LucideZap className="w-3 h-3 text-white" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                                    {produto.title}
                                  </h3>
                                  <div className="flex items-center gap-3 mb-3">
                                    <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                                      {formatPrice(produto.price)}
                                    </span>
                                    <Badge variant="secondary" className="text-xs animate-pulse">
                                      {getConditionText(produto.condition)}
                                    </Badge>
                                    {produto.original_price && produto.original_price > produto.price && (
                                      <span className="text-sm text-gray-500 line-through">
                                        {formatPrice(produto.original_price)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-xs">
                                    {produto.shipping?.free_shipping && (
                                      <span className="flex items-center gap-1 text-green-600 font-medium">
                                        <LucideZap className="w-3 h-3" />
                                        Frete grátis
                                      </span>
                                    )}
                                    {produto.reviews && (
                                      <div className="flex items-center gap-1">
                                        <LucideStar className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        <span className="font-medium">{produto.reviews.rating_average.toFixed(1)}</span>
                                        <span className="text-gray-500">({produto.reviews.total})</span>
                                      </div>
                                    )}
                                    {produto.sold_quantity && (
                                      <span className="flex items-center gap-1 text-gray-600">
                                        <LucideShoppingCart className="w-3 h-3" />
                                        {produto.sold_quantity} vendidos
                                      </span>
                                    )}
                                  </div>
                                  {produto.seller?.reputation && (
                                    <div className="mt-2">
                                      <Badge 
                                        className={`text-xs ${getReputationColor(produto.seller.reputation.level_id)}`}
                                        variant="outline"
                                      >
                                        <LucideShield className="w-3 h-3 mr-1" />
                                        Vendedor {getReputationText(produto.seller.reputation.level_id)}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Product */}
            {selected && (
              <Card className="mb-8 overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/30 to-blue-50/30 animate-slide-up">
                <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <LucideShoppingCart className="w-5 h-5" />
                      </div>
                      Produto Selecionado
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={clearSelection} className="text-white hover:bg-white/20">
                      <LucideX className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="relative">
                      <img
                        src={selected.thumbnail.replace('I.jpg', 'O.jpg')}
                        alt={selected.title}
                        className="w-full lg:w-64 h-64 object-cover rounded-2xl shadow-lg hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = selected.thumbnail;
                        }}
                      />
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                        Selecionado
                      </div>
                    </div>
                    <div className="flex-1 space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3 leading-tight">
                          {selected.title}
                        </h3>
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                            {formatPrice(selected.price)}
                          </span>
                          <Badge variant="secondary" className="animate-bounce">
                            {getConditionText(selected.condition)}
                          </Badge>
                          {selected.shipping?.free_shipping && (
                            <Badge variant="success" className="text-xs animate-pulse">
                              🚚 Frete grátis
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <span className="text-gray-600 block mb-1">ID do Produto:</span>
                          <span className="font-mono text-gray-800 font-semibold">{selected.id}</span>
                        </div>
                        {selected.available_quantity && (
                          <div className="bg-blue-50 rounded-xl p-4">
                            <span className="text-gray-600 block mb-1">Estoque:</span>
                            <span className="text-gray-800 font-semibold">{selected.available_quantity} unidades</span>
                          </div>
                        )}
                        {selected.reviews && (
                          <div className="bg-yellow-50 rounded-xl p-4">
                            <span className="text-gray-600 block mb-1">Avaliação:</span>
                            <div className="flex items-center gap-2">
                              <LucideStar className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-gray-800 font-semibold">
                                {selected.reviews.rating_average.toFixed(1)} ({selected.reviews.total} avaliações)
                              </span>
                            </div>
                          </div>
                        )}
                        {selected.seller?.reputation && (
                          <div className="bg-green-50 rounded-xl p-4">
                            <span className="text-gray-600 block mb-1">Reputação do Vendedor:</span>
                            <Badge 
                              className={`mt-1 ${getReputationColor(selected.seller.reputation.level_id)}`}
                              variant="outline"
                            >
                              <LucideShield className="w-3 h-3 mr-1" />
                              {getReputationText(selected.seller.reputation.level_id)}
                            </Badge>
                          </div>
                        )}
                        {selected.sold_quantity && (
                          <div className="bg-purple-50 rounded-xl p-4">
                            <span className="text-gray-600 block mb-1">Vendas:</span>
                            <span className="text-gray-800 font-semibold">{selected.sold_quantity} vendidos</span>
                          </div>
                        )}
                        {selected.seller && (
                          <div className="bg-indigo-50 rounded-xl p-4">
                            <span className="text-gray-600 block mb-1">Vendedor:</span>
                            <span className="text-gray-800 font-semibold">{selected.seller.nickname}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          onClick={adicionarProduto}
                          disabled={loading}
                          className="group flex-1 h-12 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl"
                        >
                          {loading ? (
                            <>
                              <LucideLoader className="mr-2 w-5 h-5 animate-spin" />
                              Adicionando...
                            </>
                          ) : (
                            <>
                              <LucidePlus className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                              Adicionar ao Monitoramento
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open(selected.permalink, '_blank')}
                          className="h-12 border-2"
                        >
                          <LucideExternalLink className="mr-2 w-5 h-5" />
                          Ver no ML
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Message */}
            {error && (
              <Card className="mb-8 border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 animate-shake">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <LucideX className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-800 mb-1">Atenção</h3>
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!selected && !loading && searchAttempted && sugestoes.length === 0 && (
              <Card className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50/30">
                <CardContent>
                  <div className="w-20 h-20 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <LucideSearch className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Tente usar palavras-chave diferentes ou verifique a ortografia. 
                    Você também pode tentar uma das sugestões populares.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {produtosSugeridos.slice(0, 6).map((produto, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setQuery(produto);
                          buscarSugestoes(produto);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full text-sm font-medium transition-all hover:scale-105 hover:shadow-md"
                      >
                        {produto}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            {!selected && query.length === 0 && (
              <Card className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 border-0 shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl flex items-center justify-center gap-3">
                    <LucideSparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
                    Como funciona nossa mágica?
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Siga estes passos e comece a economizar hoje mesmo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center group">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <span className="text-white font-bold text-xl">1</span>
                      </div>
                      <h3 className="font-bold text-gray-800 mb-3 text-lg">🔍 Pesquise</h3>
                      <p className="text-gray-600">
                        Digite o nome do produto e veja resultados reais do Mercado Livre
                      </p>
                    </div>
                    <div className="text-center group">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <span className="text-white font-bold text-xl">2</span>
                      </div>
                      <h3 className="font-bold text-gray-800 mb-3 text-lg">✨ Selecione</h3>
                      <p className="text-gray-600">
                        Escolha o produto com melhor preço e reputação do vendedor
                      </p>
                    </div>
                    <div className="text-center group">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <span className="text-white font-bold text-xl">3</span>
                      </div>
                      <h3 className="font-bold text-gray-800 mb-3 text-lg">🚀 Economize</h3>
                      <p className="text-gray-600">
                        Receba alertas automáticos e aproveite as melhores oportunidades
                      </p>
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