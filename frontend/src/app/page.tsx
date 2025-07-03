"use client";
import { FaCheckCircle, FaGoogle, FaEnvelope, FaCrown, FaShoppingCart, FaBell, FaChartLine, FaClock, FaMoneyBillWave, FaUserFriends } from "react-icons/fa";
import { LucideArrowRight, LucideZap, LucideShield, LucideTrendingUp, LucideUsers, LucideStar, LucideAlertTriangle, LucideEye, LucideHeart } from "lucide-react";
import { Button } from "./components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/Card";
import { Badge } from "./components/ui/Badge";
import { signIn } from "next-auth/react";

export default function Home() {
  const painPoints = [
    {
      icon: <LucideAlertTriangle className="w-8 h-8 text-red-500" />,
      title: "Você está perdendo dinheiro todos os dias",
      description: "Produtos que você quer ficam mais caros enquanto você espera. Sem monitoramento, você paga mais caro pelos mesmos itens."
    },
    {
      icon: <FaClock className="w-8 h-8 text-orange-500" />,
      title: "Muito tempo perdido acompanhando preços",
      description: "Verificar manualmente os preços todos os dias é cansativo e ineficiente. Você tem coisas mais importantes para fazer."
    },
    {
      icon: <LucideEye className="w-8 h-8 text-purple-500" />,
      title: "Promoções passam despercebidas",
      description: "As melhores ofertas aparecem em horários aleatórios e desaparecem rapidamente. Você sempre fica sabendo tarde demais."
    }
  ];

  const features = [
    {
      icon: <LucideTrendingUp className="w-6 h-6" />,
      title: "Monitoramento Inteligente 24/7",
      description: "Nossa IA acompanha preços constantemente e te avisa na hora certa",
      benefit: "Nunca mais perca uma promoção"
    },
    {
      icon: <FaBell className="w-6 h-6" />,
      title: "Alertas Instantâneos Personalizados",
      description: "Defina seu preço ideal e receba notificações no WhatsApp, email e push",
      benefit: "Compre no momento perfeito"
    },
    {
      icon: <FaChartLine className="w-6 h-6" />,
      title: "Análise Histórica Completa",
      description: "Gráficos detalhados mostram o melhor momento para comprar",
      benefit: "Tome decisões baseadas em dados"
    },
    {
      icon: <LucideZap className="w-6 h-6" />,
      title: "IA que Entende Avaliações",
      description: "Resumos automáticos de milhares de avaliações em segundos",
      benefit: "Compre produtos de qualidade"
    },
    {
      icon: <LucideHeart className="w-6 h-6" />,
      title: "Lista de Desejos Inteligente",
      description: "Organize seus produtos favoritos e acompanhe todos em um lugar",
      benefit: "Controle total dos seus interesses"
    },
    {
      icon: <LucideShield className="w-6 h-6" />,
      title: "Proteção contra Golpes",
      description: "Analisamos vendedores e alertamos sobre riscos potenciais",
      benefit: "Compre com segurança total"
    }
  ];

  const testimonials = [
    {
      name: "Ana Carolina",
      role: "Revendedora de Eletrônicos",
      content: "Economizei R$ 3.400 em apenas 2 meses! O VigIA me avisou quando o iPhone que eu queria baixou 15%. Indispensável para quem revende!",
      rating: 5,
      savings: "R$ 3.400"
    },
    {
      name: "Roberto Silva",
      role: "Pai de Família",
      content: "Como pai, preciso economizar em tudo. O VigIA me ajuda a comprar os brinquedos e roupas das crianças sempre no melhor preço. Minha esposa ficou impressionada!",
      rating: 5,
      savings: "R$ 850"
    },
    {
      name: "Carla Mendes",
      role: "Estudante de Medicina",
      content: "Consegui comprar todos os livros da faculdade gastando 40% menos. O sistema de alertas é perfeito para quem tem orçamento apertado!",
      rating: 5,
      savings: "R$ 1.200"
    }
  ];

  const stats = [
    { value: "R$ 4,2M", label: "Economizados pelos usuários", icon: <FaMoneyBillWave /> },
    { value: "47%", label: "Economia média por compra", icon: <LucideTrendingUp /> },
    { value: "25.000+", label: "Produtos monitorados diariamente", icon: <LucideEye /> },
    { value: "15min", label: "Tempo médio para primeira economia", icon: <FaClock /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Floating Header */}
      <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-blue-100/60">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <FaShoppingCart className="text-white text-sm" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              VigIA
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#problemas" className="text-blue-700 font-medium hover:text-blue-800 transition-colors">Por que usar?</a>
            <a href="#solucao" className="text-blue-700 font-medium hover:text-blue-800 transition-colors">Como funciona</a>
            <a href="#resultados" className="text-blue-700 font-medium hover:text-blue-800 transition-colors">Resultados</a>
            <a href="#planos" className="text-blue-700 font-medium hover:text-blue-800 transition-colors">Preços</a>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => signIn("google")}
            >
              Entrar
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 text-blue-700 bg-blue-100/80 animate-pulse">
            🔥 +1.200 usuários economizando esta semana
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent">
              Pare de Perder Dinheiro
            </span>
            <br />
            <span className="text-gray-800">no Mercado Livre</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto leading-relaxed">
            <strong className="text-red-600">Você está pagando mais caro</strong> pelos mesmos produtos que outras pessoas compram com desconto.
          </p>
          
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            O VigIA monitora preços 24h e te avisa no <strong>momento exato</strong> para economizar de verdade.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="xl" 
              className="group relative overflow-hidden"
              onClick={() => signIn("google")}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative flex items-center">
                <FaGoogle className="mr-2" />
                Começar a Economizar GRÁTIS
                <LucideArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
            <Button variant="outline" size="xl">
              <FaEnvelope className="mr-2" />
              Ver Como Funciona (2 min)
            </Button>
          </div>

          <p className="text-sm text-green-600 font-semibold mb-8">
            ✅ Grátis para sempre • ✅ Sem cartão de crédito • ✅ Resultados em 15 minutos
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <Card key={index} className="p-4 bg-gradient-to-br from-blue-50/50 to-blue-100/30">
                <div className="flex items-center justify-center mb-2 text-blue-600">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-blue-700 mb-1">{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section id="problemas" className="py-20 px-4 bg-gradient-to-r from-red-50/50 to-orange-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Você Reconhece Estes
              <span className="text-red-600"> Problemas</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Se você responder "SIM" para qualquer um destes, o VigIA vai mudar sua vida
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {painPoints.map((pain, index) => (
              <Card key={index} className="group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-100/50 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="relative">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    {pain.icon}
                  </div>
                  <CardTitle className="text-xl">{pain.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <CardDescription className="text-gray-600 text-base">
                    {pain.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Card className="p-8 bg-gradient-to-r from-red-600/10 to-orange-600/10 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-red-700 mb-4">
                💸 Resultado: Você gasta R$ 200-500 a mais por mês
              </h3>
              <p className="text-gray-700">
                Isso é mais de <strong>R$ 3.600 por ano</strong> que poderiam estar na sua conta. 
                Tempo de mudar isso, não acha?
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solucao" className="py-20 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="success" className="mb-4">A Solução</Badge>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Como o VigIA Te Faz
              <span className="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent"> Economizar</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Sistema inteligente que trabalha 24h para você pagar menos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100/30 to-blue-100/30 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                <CardHeader className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-xl flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <Badge variant="success" className="w-fit">
                    {feature.benefit}
                  </Badge>
                </CardHeader>
                <CardContent className="relative">
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              size="xl" 
              className="group"
              onClick={() => signIn("google")}
            >
              <FaGoogle className="mr-2" />
              Quero Começar a Economizar Agora
              <LucideArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="resultados" className="py-20 px-4 bg-gradient-to-r from-green-50/50 to-blue-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="success" className="mb-4">Resultados Reais</Badge>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Veja Quanto Nossos Usuários
              <span className="text-green-600"> Economizaram</span>
            </h2>
            <p className="text-xl text-gray-600">
              Histórias reais de pessoas que mudaram sua forma de comprar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Badge variant="success" className="text-xs">
                    Economizou {testimonial.savings}
                  </Badge>
                </div>
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <LucideStar key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-gray-700 text-base leading-relaxed">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                      <FaUserFriends className="text-blue-600 text-sm" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Planos Simples</Badge>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Invista R$ 19,90 para Economizar
              <span className="text-green-600"> Centenas Todo Mês</span>
            </h2>
            <p className="text-xl text-gray-600">
              ROI médio de 1.500% nos primeiros 30 dias
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Teste Grátis</CardTitle>
                <div className="text-4xl font-bold text-gray-800 mt-4">
                  R$ 0
                  <span className="text-lg font-normal text-gray-500">/sempre</span>
                </div>
                <CardDescription>Prove o resultado antes de pagar</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "5 produtos monitorados",
                    "Alertas por email",
                    "Histórico de 30 dias",
                    "Análise básica de preços"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <FaCheckCircle className="text-green-500 text-sm" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full mt-6" 
                  variant="outline"
                  onClick={() => signIn("google")}
                >
                  Começar Teste Grátis
                </Button>
                <p className="text-xs text-center text-gray-500 mt-2">
                  Sem cartão • Sem compromisso
                </p>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-green-300 bg-gradient-to-br from-green-50/50 to-green-100/30 scale-105">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-green-600 to-green-700">
                  <FaCrown className="mr-1" /> Mais Escolhido
                </Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">VigIA Pro</CardTitle>
                <div className="text-4xl font-bold text-green-700 mt-4">
                  R$ 19,90
                  <span className="text-lg font-normal text-gray-500">/mês</span>
                </div>
                <CardDescription>Se paga na primeira compra</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "Produtos ILIMITADOS",
                    "Alertas WhatsApp + Email + Push",
                    "Histórico completo + Gráficos",
                    "IA para análise de avaliações",
                    "Análise de vendedores",
                    "Alertas de cupons",
                    "Suporte prioritário 24h"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <FaCheckCircle className="text-green-500 text-sm" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full mt-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  onClick={() => signIn("google")}
                >
                  Começar com 7 Dias Grátis
                </Button>
                <p className="text-xs text-center text-gray-500 mt-2">
                  Cancele quando quiser • Garantia 30 dias
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Card className="p-8 bg-gradient-to-r from-green-600/10 to-green-700/10 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-green-700 mb-4">
                🎯 Garantia de Resultado
              </h3>
              <p className="text-gray-700">
                Se você não economizar pelo menos R$ 50 nos primeiros 30 dias, 
                <strong> devolvemos 100% do seu dinheiro</strong>. Sem perguntas.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Chega de Pagar Caro por Produtos do Mercado Livre
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Junte-se a mais de 25.000 brasileiros que já economizam com o VigIA
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="xl" 
              variant="secondary"
              className="group bg-white text-blue-700 hover:bg-gray-100"
              onClick={() => signIn("google")}
            >
              <FaGoogle className="mr-2" />
              Começar Agora - É GRÁTIS
              <LucideArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 text-sm opacity-80">
            <span>✅ 25.000+ usuários ativos</span>
            <span>✅ R$ 4,2M economizados</span>
            <span>✅ Nota 4.9/5 estrelas</span>
            <span>✅ Grátis para sempre</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <FaShoppingCart className="text-white text-sm" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                VigIA
              </span>
            </div>
            <div className="text-gray-500 text-center md:text-right">
              <p>Desenvolvido com ❤️ para economizar dinheiro dos brasileiros</p>
              <p className="text-sm mt-1">© 2024 VigIA. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}