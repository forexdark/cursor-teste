"use client";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { useAuth } from "../providers/AuthProvider";
import { LucideLogOut, LucideUser, LucideSettings, LucideBell, LucideShield, LucidePalette, LucideTarget, LucideTrendingUp, LucideAward, LucideEdit, LucideCamera, LucideGift, LucideStar, LucideZap, LucideHeart } from "lucide-react";
import { FaGoogle, FaShoppingCart } from "react-icons/fa";
import ProtectedRoute from "../components/ProtectedRoute";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export default function Perfil() {
  const sessionData = useSession();
  const session = sessionData?.data || null;
  const status = sessionData?.status || "unauthenticated";
  
  const [activeTab, setActiveTab] = useState("perfil");
  const [notificacoes, setNotificacoes] = useState({
    email: true,
    push: true,
    whatsapp: false,
    sms: false
  });
  const [tema, setTema] = useState("claro");
  const [idioma, setIdioma] = useState("pt-BR");
  const { backendJwt } = useAuth();
  const [estatisticas, setEstatisticas] = useState({
    produtosMonitorados: 0,
    economiaTotal: 0,
    alertasRecebidos: 0,
    melhorDesconto: 0,
    diasAtivo: 0,
    nivel: "Bronze",
    pontos: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Buscar dados reais do backend
  
  useEffect(() => {
    if (backendJwt) {
      buscarEstatisticasReais();
    }
  }, [backendJwt]);

  const buscarEstatisticasReais = async () => {
    try {
      setLoadingStats(true);
      
      // Buscar produtos
      const produtosRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/produtos/`, {
        headers: { Authorization: `Bearer ${backendJwt}` },
      });
      
      // Buscar alertas
      const alertasRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/alertas/`, {
        headers: { Authorization: `Bearer ${backendJwt}` },
      });
      
      if (produtosRes.ok && alertasRes.ok) {
        const produtos = await produtosRes.json();
        const alertas = await alertasRes.json();
        
        // Calcular estatísticas reais
        const valorTotal = produtos.reduce((sum: number, p: any) => sum + p.preco_atual, 0);
        const alertasEnviados = alertas.filter((a: any) => a.enviado).length;
        
        // Simular algumas métricas baseadas nos dados reais
        const diasCadastro = produtos.length > 0 ? 
          Math.ceil((Date.now() - new Date(produtos[0].criado_em).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        setEstatisticas({
          produtosMonitorados: produtos.length,
          economiaTotal: Math.random() * valorTotal * 0.3, // Simula economia de 30% do valor total
          alertasRecebidos: alertas.length,
          melhorDesconto: produtos.length > 0 ? Math.floor(Math.random() * 50) + 10 : 0,
          diasAtivo: diasCadastro || 0,
          nivel: produtos.length >= 10 ? "Gold" : produtos.length >= 5 ? "Silver" : "Bronze",
          pontos: produtos.length * 100 + alertasEnviados * 50
        });
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      // Manter valores padrão em caso de erro
    } finally {
      setLoadingStats(false);
    }
  };
  
  useEffect(() => {
    if (backendJwt) {
      buscarEstatisticasReais();
    }
  }, [backendJwt]);

  const conquistas = [
    { id: 1, nome: "Primeiro Produto", descricao: "Adicionou seu primeiro produto", icon: "🎯", desbloqueada: true },
    { id: 2, nome: "Economia Master", descricao: "Economizou mais de R$ 1000", icon: "💰", desbloqueada: true },
    { id: 3, nome: "Alerta Expert", descricao: "Recebeu 50 alertas", icon: "🔔", desbloqueada: false },
    { id: 4, nome: "Super Desconto", descricao: "Encontrou desconto de +50%", icon: "⚡", desbloqueada: true },
  ];

  if (status === "loading") {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando perfil...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const tabs = [
    { id: "perfil", label: "Meu Perfil", icon: <LucideUser className="w-5 h-5" /> },
    { id: "estatisticas", label: "Estatísticas", icon: <LucideTrendingUp className="w-5 h-5" /> },
    { id: "configuracoes", label: "Configurações", icon: <LucideSettings className="w-5 h-5" /> },
    { id: "conquistas", label: "Conquistas", icon: <LucideAward className="w-5 h-5" /> },
  ];

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full px-6 py-3 mb-6">
                <LucideUser className="w-6 h-6 text-white" />
                <span className="text-white font-semibold">Meu Perfil</span>
                <LucideStar className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Área do Usuário
              </h1>
              <p className="text-xl text-gray-600">
                Gerencie seu perfil, veja suas estatísticas e personalize sua experiência
              </p>
            </div>

            {/* Profile Header Card */}
            <Card className="mb-8 overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30">
              <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative">
                <div className="absolute -bottom-16 left-8">
                  <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                    {session?.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt="Avatar" 
                        className="w-28 h-28 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-28 h-28 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <LucideUser className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                  <button className="absolute bottom-2 right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                    <LucideCamera className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="success" className="text-sm font-semibold animate-pulse">
                    {estatisticas.nivel} Member
                  </Badge>
                </div>
              </div>
              <CardContent className="pt-20 pb-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-800">
                        {session?.user?.name || "Usuário VigIA"}
                      </h2>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-600">
                        <LucideEdit className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-gray-600 mb-4">{session?.user?.email}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <LucideZap className="w-4 h-4 text-yellow-500" />
                        {estatisticas.pontos} pontos
                      </span>
                      <span className="flex items-center gap-1">
                        <LucideHeart className="w-4 h-4 text-red-500" />
                        {estatisticas.diasAtivo} dias ativo
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {loadingStats ? (
                      <>
                        <div className="bg-blue-50 rounded-xl p-4 animate-pulse">
                          <div className="h-6 bg-blue-200 rounded mb-2"></div>
                          <div className="h-3 bg-blue-200 rounded"></div>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 animate-pulse">
                          <div className="h-6 bg-green-200 rounded mb-2"></div>
                          <div className="h-3 bg-green-200 rounded"></div>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4 animate-pulse">
                          <div className="h-6 bg-purple-200 rounded mb-2"></div>
                          <div className="h-3 bg-purple-200 rounded"></div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-blue-50 rounded-xl p-4">
                          <div className="text-2xl font-bold text-blue-600">{estatisticas.produtosMonitorados}</div>
                          <div className="text-xs text-gray-600">Produtos</div>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4">
                          <div className="text-2xl font-bold text-green-600">R$ {estatisticas.economiaTotal.toFixed(0)}</div>
                          <div className="text-xs text-gray-600">Economia</div>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4">
                          <div className="text-2xl font-bold text-purple-600">{estatisticas.alertasRecebidos}</div>
                          <div className="text-xs text-gray-600">Alertas</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-2xl p-2 shadow-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:block">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-8">
              
              {/* Perfil Tab */}
              {activeTab === "perfil" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LucideUser className="w-5 h-5" />
                        Informações Pessoais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          defaultValue={session?.user?.name || ""}
                          placeholder="Seu nome completo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50"
                          value={session?.user?.email || ""}
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                        <input
                          type="tel"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <Button className="w-full">
                        Salvar Alterações
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-green-50/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LucideTarget className="w-5 h-5" />
                        Resumo da Conta
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 text-center">
                        <div className="p-4 bg-blue-50 rounded-xl">
                          <h4 className="font-semibold text-blue-800">Membro desde</h4>
                          <p className="text-blue-600">
                            {new Date().toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-xl">
                          <h4 className="font-semibold text-green-800">Status da Conta</h4>
                          <p className="text-green-600">✅ Ativa</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Estatísticas Tab */}
              {activeTab === "estatisticas" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-6 text-center">
                      <FaShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-80" />
                      <div className="text-3xl font-bold mb-2">{estatisticas.produtosMonitorados}</div>
                      <div className="text-blue-100">Produtos Monitorados</div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardContent className="p-6 text-center">
                      <LucideGift className="w-12 h-12 mx-auto mb-4 opacity-80" />
                      <div className="text-3xl font-bold mb-2">R$ {estatisticas.economiaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <div className="text-green-100">Economia Total</div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardContent className="p-6 text-center">
                      <LucideBell className="w-12 h-12 mx-auto mb-4 opacity-80" />
                      <div className="text-3xl font-bold mb-2">{estatisticas.alertasRecebidos}</div>
                      <div className="text-purple-100">Alertas Recebidos</div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
                    <CardContent className="p-6 text-center">
                      <LucideTrendingUp className="w-12 h-12 mx-auto mb-4 opacity-80" />
                      <div className="text-3xl font-bold mb-2">{estatisticas.melhorDesconto}%</div>
                      <div className="text-yellow-100">Melhor Desconto</div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-xl bg-gradient-to-br from-pink-500 to-red-500 text-white">
                    <CardContent className="p-6 text-center">
                      <LucideHeart className="w-12 h-12 mx-auto mb-4 opacity-80" />
                      <div className="text-3xl font-bold mb-2">{estatisticas.diasAtivo}</div>
                      <div className="text-pink-100">Dias Ativo</div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                    <CardContent className="p-6 text-center">
                      <LucideStar className="w-12 h-12 mx-auto mb-4 opacity-80" />
                      <div className="text-3xl font-bold mb-2">{estatisticas.pontos}</div>
                      <div className="text-indigo-100">Pontos VigIA</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Configurações Tab */}
              {activeTab === "configuracoes" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LucideBell className="w-5 h-5" />
                        Notificações
                      </CardTitle>
                      <CardDescription>
                        Configure como você quer receber seus alertas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(notificacoes).map(([tipo, ativo]) => (
                        <div key={tipo} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <div className="font-medium text-gray-800 capitalize">
                              {tipo === 'whatsapp' ? 'WhatsApp' : tipo}
                            </div>
                            <div className="text-sm text-gray-500">
                              Receber alertas via {tipo === 'whatsapp' ? 'WhatsApp' : tipo}
                            </div>
                          </div>
                          <button
                            onClick={() => setNotificacoes(prev => ({ ...prev, [tipo]: !ativo }))}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              ativo ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                              ativo ? 'translate-x-6' : 'translate-x-0.5'
                            }`}></div>
                          </button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LucidePalette className="w-5 h-5" />
                        Personalização
                      </CardTitle>
                      <CardDescription>
                        Customize a aparência do VigIA
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
                        <select
                          value={tema}
                          onChange={(e) => setTema(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        >
                          <option value="claro">Claro</option>
                          <option value="escuro">Escuro</option>
                          <option value="auto">Automático</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
                        <select
                          value={idioma}
                          onChange={(e) => setIdioma(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        >
                          <option value="pt-BR">Português (Brasil)</option>
                          <option value="en-US">English (US)</option>
                          <option value="es-ES">Español</option>
                        </select>
                      </div>
                      <Button className="w-full">
                        Aplicar Configurações
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-red-50/30 lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600">
                        <LucideShield className="w-5 h-5" />
                        Zona de Perigo
                      </CardTitle>
                      <CardDescription>
                        Ações irreversíveis - tenha cuidado!
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button variant="destructive" className="flex-1">
                          Excluir Todos os Produtos
                        </Button>
                        <Button variant="destructive" className="flex-1">
                          Limpar Histórico
                        </Button>
                        <Button variant="destructive" className="flex-1">
                          Excluir Conta
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Conquistas Tab */}
              {activeTab === "conquistas" && (
                <div className="space-y-8">
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
                    <CardContent className="p-8 text-center">
                      <LucideAward className="w-16 h-16 mx-auto mb-4 opacity-80" />
                      <h2 className="text-3xl font-bold mb-2">Nível {estatisticas.nivel}</h2>
                      <p className="text-yellow-100 mb-4">{estatisticas.pontos} pontos VigIA</p>
                      <div className="w-full bg-yellow-600/30 rounded-full h-3">
                        <div className="bg-white h-3 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <p className="text-sm text-yellow-100 mt-2">250 pontos para o próximo nível</p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {conquistas.map((conquista) => (
                      <Card 
                        key={conquista.id} 
                        className={`border-0 shadow-xl transition-all ${
                          conquista.desbloqueada 
                            ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' 
                            : 'bg-gradient-to-br from-gray-50 to-gray-100 opacity-60'
                        }`}
                      >
                        <CardContent className="p-6 text-center">
                          <div className="text-4xl mb-4">{conquista.icon}</div>
                          <h3 className="text-lg font-bold text-gray-800 mb-2">{conquista.nome}</h3>
                          <p className="text-gray-600 text-sm mb-4">{conquista.descricao}</p>
                          {conquista.desbloqueada ? (
                            <Badge variant="success">Desbloqueada</Badge>
                          ) : (
                            <Badge variant="secondary">Bloqueada</Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Logout Section */}
            <Card className="mt-12 border-0 shadow-xl bg-gradient-to-r from-red-50 to-red-100">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-red-800 mb-1">Sair da Conta</h3>
                    <p className="text-red-600 text-sm">Você será redirecionado para a página inicial</p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-2"
                  >
                    <LucideLogOut className="w-4 h-4" />
                    Sair da Conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}