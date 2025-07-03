"use client";
import Link from "next/link";
import { useProdutos } from "../hooks/useProdutos";
import { LucidePlus, LucideRefreshCw, LucideTrendingUp, LucideTrendingDown, LucideEye, LucideExternalLink, LucidePackage } from "lucide-react";
import { FaShoppingCart } from "react-icons/fa";
import ProtectedRoute from "../components/ProtectedRoute";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export default function Dashboard() {
  const { produtos, loading, error, refetch } = useProdutos();

  const totalValue = produtos.reduce((sum, p) => sum + p.preco_atual, 0);
  const averagePrice = produtos.length > 0 ? totalValue / produtos.length : 0;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/50">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                  Dashboard
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
            <Card>
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

            <Card>
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

            <Card>
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
                <Card key={produto.id} className="group hover:shadow-xl transition-all duration-300">
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
              <Card className="text-center py-12">
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
                <Card key={i} className="animate-pulse">
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
      </main>
    </ProtectedRoute>
  );
}