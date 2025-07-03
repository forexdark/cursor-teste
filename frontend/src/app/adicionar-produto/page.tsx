"use client";
import { useAuth } from "../providers/AuthProvider";
import { useState, useRef, useEffect } from "react";
import { LucideSearch, LucideCheckCircle, LucideX, LucideExternalLink, LucidePlus, LucideLoader, LucideShoppingCart, LucideStar, LucideFilter } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import ProtectedRoute from "../components/ProtectedRoute";

interface ProdutoML {
  id: string;
  title: string;
  price: number;
  thumbnail: string;
  permalink: string;
  condition: string;
  shipping?: {
    free_shipping: boolean;
  };
  seller?: {
    reputation?: {
      level_id: string;
    };
  };
  reviews?: {
    rating_average: number;
    total: number;
  };
  category_id?: string;
  available_quantity?: number;
}

export default function AdicionarProduto() {
  const { backendJwt } = useAuth();
  const [query, setQuery] = useState("");
  const [sugestoes, setSugestoes] = useState<ProdutoML[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ProdutoML | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({
    condition: 'all',
    shipping: 'all',
    price_min: '',
    price_max: ''
  });
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

  async function buscarSugestoes(q: string) {
    if (q.length < 3) {
      setSugestoes([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=12`;
      
      // Apply filters
      if (filters.condition !== 'all') {
        url += `&condition=${filters.condition}`;
      }
      if (filters.shipping !== 'all') {
        url += `&shipping=${filters.shipping}`;
      }
      if (filters.price_min) {
        url += `&price=${filters.price_min}-${filters.price_max || ''}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setSugestoes(data.results || []);
      setShowSuggestions(true);
    } catch (e: any) {
      setError("Erro ao buscar produtos");
      setSugestoes([]);
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
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erro ao adicionar produto");
      }
      
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (e: any) {
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
      '5_green': 'bg-green-100 text-green-800',
      '4_light_green': 'bg-green-100 text-green-700',
      '3_yellow': 'bg-yellow-100 text-yellow-800',
      '2_orange': 'bg-orange-100 text-orange-800',
      '1_red': 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (success) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-200 p-4">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LucideCheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-800 mb-2">Produto Adicionado!</h1>
            <p className="text-green-600 mb-4">Agora você receberá alertas sobre este produto.</p>
            <div className="text-sm text-gray-500">Redirecionando para o dashboard...</div>
          </Card>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Adicionar Produto para Monitoramento
              </h1>
              <p className="text-gray-600">
                Pesquise produtos do Mercado Livre e receba alertas quando o preço baixar
              </p>
            </div>

            {/* Search Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LucideSearch className="w-5 h-5" />
                  Pesquisar Produto
                </CardTitle>
                <CardDescription>
                  Digite o nome do produto que você quer monitorar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative" ref={searchRef}>
                    <div className="relative">
                      <LucideSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        type="text"
                        placeholder="Ex: iPhone 15, Notebook Dell, Tênis Nike..."
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
                        <LucideLoader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 animate-spin" />
                      )}
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && sugestoes.length > 0 && (
                      <div className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded-xl mt-2 shadow-xl max-h-96 overflow-y-auto">
                        <div className="p-2">
                          {sugestoes.map((produto) => (
                            <div
                              key={produto.id}
                              className={`p-4 rounded-lg cursor-pointer transition-all hover:bg-blue-50 ${
                                selected?.id === produto.id ? "bg-blue-100 border border-blue-300" : ""
                              }`}
                              onClick={() => {
                                setSelected(produto);
                                setQuery(produto.title);
                                setShowSuggestions(false);
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <img
                                  src={produto.thumbnail}
                                  alt={produto.title}
                                  className="w-16 h-16 object-cover rounded-lg"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder-product.png';
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1">
                                    {produto.title}
                                  </h3>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg font-bold text-blue-600">
                                      {formatPrice(produto.price)}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                      {getConditionText(produto.condition)}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    {produto.shipping?.free_shipping && (
                                      <span className="text-green-600 font-medium">Frete grátis</span>
                                    )}
                                    {produto.reviews && (
                                      <div className="flex items-center gap-1">
                                        <LucideStar className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        <span>{produto.reviews.rating_average.toFixed(1)}</span>
                                        <span>({produto.reviews.total})</span>
                                      </div>
                                    )}
                                    {produto.available_quantity && (
                                      <span>{produto.available_quantity} disponíveis</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Condição
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.condition}
                        onChange={(e) => setFilters({...filters, condition: e.target.value})}
                      >
                        <option value="all">Todas</option>
                        <option value="new">Novo</option>
                        <option value="used">Usado</option>
                        <option value="refurbished">Recondicionado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frete
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.shipping}
                        onChange={(e) => setFilters({...filters, shipping: e.target.value})}
                      >
                        <option value="all">Todos</option>
                        <option value="free">Frete grátis</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preço mín.
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="R$ 0"
                        value={filters.price_min}
                        onChange={(e) => setFilters({...filters, price_min: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preço máx.
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="R$ 999"
                        value={filters.price_max}
                        onChange={(e) => setFilters({...filters, price_max: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Product */}
            {selected && (
              <Card className="mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <LucideShoppingCart className="w-5 h-5" />
                      Produto Selecionado
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={clearSelection}>
                      <LucideX className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6">
                    <img
                      src={selected.thumbnail.replace('I.jpg', 'O.jpg')}
                      alt={selected.title}
                      className="w-full md:w-48 h-48 object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = selected.thumbnail;
                      }}
                    />
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {selected.title}
                        </h3>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl font-bold text-blue-600">
                            {formatPrice(selected.price)}
                          </span>
                          <Badge variant="secondary">
                            {getConditionText(selected.condition)}
                          </Badge>
                          {selected.shipping?.free_shipping && (
                            <Badge variant="success" className="text-xs">
                              Frete grátis
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">ID do Produto:</span>
                          <span className="block font-mono text-gray-800">{selected.id}</span>
                        </div>
                        {selected.available_quantity && (
                          <div>
                            <span className="text-gray-500">Estoque:</span>
                            <span className="block text-gray-800">{selected.available_quantity} unidades</span>
                          </div>
                        )}
                        {selected.reviews && (
                          <div>
                            <span className="text-gray-500">Avaliação:</span>
                            <div className="flex items-center gap-1">
                              <LucideStar className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-gray-800">
                                {selected.reviews.rating_average.toFixed(1)} ({selected.reviews.total} avaliações)
                              </span>
                            </div>
                          </div>
                        )}
                        {selected.seller?.reputation?.level_id && (
                          <div>
                            <span className="text-gray-500">Reputação do Vendedor:</span>
                            <Badge 
                              className={`mt-1 ${getReputationColor(selected.seller.reputation.level_id)}`}
                              variant="outline"
                            >
                              {selected.seller.reputation.level_id.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={adicionarProduto}
                          disabled={loading}
                          className="group"
                        >
                          {loading ? (
                            <>
                              <LucideLoader className="mr-2 w-4 h-4 animate-spin" />
                              Adicionando...
                            </>
                          ) : (
                            <>
                              <LucidePlus className="mr-2 w-4 h-4 group-hover:scale-110 transition-transform" />
                              Adicionar ao Monitoramento
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open(selected.permalink, '_blank')}
                        >
                          <LucideExternalLink className="mr-2 w-4 h-4" />
                          Ver no Mercado Livre
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Message */}
            {error && (
              <Card className="mb-8 border-red-200 bg-red-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <LucideX className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-800">Erro</h3>
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!selected && !loading && query.length > 0 && sugestoes.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LucideSearch className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-gray-600">
                    Tente usar palavras-chave diferentes ou verifique a ortografia
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            {!selected && query.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Como funciona?</CardTitle>
                  <CardDescription>
                    Siga estes passos para começar a monitorar preços
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <span className="text-blue-600 font-bold">1</span>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-2">Pesquise</h3>
                      <p className="text-gray-600 text-sm">
                        Digite o nome do produto que você quer monitorar
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <span className="text-blue-600 font-bold">2</span>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-2">Selecione</h3>
                      <p className="text-gray-600 text-sm">
                        Escolha o produto exato que você deseja acompanhar
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <span className="text-blue-600 font-bold">3</span>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-2">Monitore</h3>
                      <p className="text-gray-600 text-sm">
                        Receba alertas automáticos quando o preço baixar
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