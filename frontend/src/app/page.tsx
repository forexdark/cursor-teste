"use client";
import { FaCheckCircle, FaGoogle, FaEnvelope, FaCrown, FaShoppingCart, FaBell, FaChartLine, FaClock, FaMoneyBillWave, FaUserFriends, FaWhatsapp, FaTelegram, FaSms, FaLightbulb, FaCog, FaGift } from "react-icons/fa";
import { LucideArrowRight, LucideZap, LucideShield, LucideTrendingUp, LucideUsers, LucideStar, LucideAlertTriangle, LucideEye, LucideHeart, LucideSparkles, LucideBrain, LucideTarget, LucideRocket, LucideScanLine } from "lucide-react";
import { Button } from "./components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/Card";
import { Badge } from "./components/ui/Badge";
import { useState } from "react";

export default function Home() {
  const [activeFeature, setActiveFeature] = useState(0);

  const painPoints = [
    {
      icon: <LucideAlertTriangle className="w-8 h-8 text-red-500" />,
      title: "Você está perdendo dinheiro todos os dias",
      description: "Produtos que você quer ficam mais caros enquanto você espera. Sem monitoramento, você paga mais caro pelos mesmos itens.",
      impact: "R$ 200-500/mês a mais"
    },
    {
      icon: <FaClock className="w-8 h-8 text-orange-500" />,
      title: "Muito tempo perdido acompanhando preços",
      description: "Verificar manualmente os preços todos os dias é cansativo e ineficiente. Você tem coisas mais importantes para fazer.",
      impact: "2-3 horas/dia desperdiçadas"
    },
    {
      icon: <LucideEye className="w-8 h-8 text-purple-500" />,
      title: "Promoções passam despercebidas",
      description: "As melhores ofertas aparecem em horários aleatórios e desaparecem rapidamente. Você sempre fica sabendo tarde demais.",
      impact: "Perda de 60-80% das ofertas"
    }
  ];

  const features = [
    {
      icon: <LucideScanLine className="w-8 h-8" />,
      title: "Monitoramento Inteligente 24/7",
      description: "Nossa IA acompanha preços constantemente e te avisa no momento certo",
      benefit: "Nunca mais perca uma promoção",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <FaBell className="w-8 h-8" />,
      title: "Alertas Multi-Canal",
      description: "WhatsApp, Telegram, SMS, email e push notifications instantâneos",
      benefit: "Receba alertas onde preferir",
      color: "from-green-500 to-green-600"
    },
    {
      icon: <FaChartLine className="w-8 h-8" />,
      title: "Análise Histórica Completa",
      description: "Gráficos detalhados mostram o melhor momento para comprar",
      benefit: "Tome decisões baseadas em dados",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <LucideBrain className="w-8 h-8" />,
      title: "IA para Análise de Avaliações",
      description: "Resumos automáticos de milhares de avaliações em segundos",
      benefit: "Compre produtos de qualidade",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      icon: <FaGift className="w-8 h-8" />,
      title: "Detector de Cupons",
      description: "Encontramos cupons e promoções automaticamente para você",
      benefit: "Economize ainda mais",
      color: "from-pink-500 to-pink-600"
    },
    {
      icon: <LucideShield className="w-8 h-8" />,
      title: "Análise de Vendedores",
      description: "Verificamos reputação e alertamos sobre vendedores suspeitos",
      benefit: "Compre com segurança total",
      color: "from-red-500 to-red-600"
    }
  ];

  const testimonials = [
    {
      name: "Ana Carolina",
      role: "Revendedora de Eletrônicos",
      content: "Economizei R$ 3.400 em apenas 2 meses! O VigIA me avisou quando o iPhone que eu queria baixou 15%. Indispensável para quem revende!",
      rating: 5,
      savings: "R$ 3.400",
      avatar: "👩‍💼"
    },
    {
      name: "Roberto Silva", 
      role: "Pai de Família",
      content: "Como pai, preciso economizar em tudo. O VigIA me ajuda a comprar os brinquedos e roupas das crianças sempre no melhor preço. Minha esposa ficou impressionada!",
      rating: 5,
      savings: "R$ 850",
      avatar: "👨‍👩‍👧‍👦"
    },
    {
      name: "Carla Mendes",
      role: "Estudante de Medicina", 
      content: "Consegui comprar todos os livros da faculdade gastando 40% menos. O sistema de alertas é perfeito para quem tem orçamento apertado!",
      rating: 5,
      savings: "R$ 1.200",
      avatar: "👩‍🎓"
    }
  ];

  const stats = [
    { value: "R$ 4,2M", label: "Economizados pelos usuários", icon: <FaMoneyBillWave />, color: "from-green-500 to-green-600" },
    { value: "47%", label: "Economia média por compra", icon: <LucideTrendingUp />, color: "from-blue-500 to-blue-600" },
    { value: "25.000+", label: "Produtos monitorados diariamente", icon: <LucideEye />, color: "from-purple-500 to-purple-600" },
    { value: "15min", label: "Tempo médio para primeira economia", icon: <FaClock />, color: "from-yellow-500 to-yellow-600" }
  ];

  const alertChannels = [
    { icon: <FaWhatsapp className="w-6 h-6" />, name: "WhatsApp", color: "text-green-500" },
    { icon: <FaTelegram className="w-6 h-6" />, name: "Telegram", color: "text-blue-500" },
    { icon: <FaSms className="w-6 h-6" />, name: "SMS", color: "text-purple-500" },
    { icon: <FaEnvelope className="w-6 h-6" />, name: "Email", color: "text-red-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-pink-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          
          {/* Logo and Navigation */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FaShoppingCart className="text-white text-xl" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VigIA
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#problemas" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Por que usar?</a>
              <a href="#solucao" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Como funciona</a>
              <a href="#resultados" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Resultados</a>
              <a href="#planos" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Preços</a>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = "/login"}
                className="hover-lift"
              >
                Entrar
              </Button>
            </div>
          </div>

          <Badge variant="premium" className="mb-8 animate-bounce">
            🔥 +1.200 usuários economizando esta semana
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 animate-fade-in">
            <span className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent">
              Pare de Perder Dinheiro
            </span>
            <br />
            <span className="text-gray-800">no Mercado Livre</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-4 max-w-4xl mx-auto leading-relaxed animate-slide-up">
            <strong className="text-red-600">Você está pagando mais caro</strong> pelos mesmos produtos que outras pessoas compram com desconto.
          </p>
          
          <p className="text-lg text-gray-600 mb-12 max-w-4xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
            O VigIA monitora preços 24h com <strong>Inteligência Artificial</strong> e te avisa no <strong>momento exato</strong> para economizar de verdade.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 animate-slide-up" style={{animationDelay: '0.4s'}}>
            <Button 
              size="xl" 
              variant="premium"
              className="group relative overflow-hidden hover-lift"
              onClick={() => window.location.href = "/login"}
            >
              <span className="relative flex items-center">
                <LucideRocket className="mr-3 w-6 h-6 group-hover:scale-110 transition-transform" />
                Começar Grátis
                <LucideArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </div>

          <p className="text-sm text-green-600 font-semibold mb-12 animate-slide-up" style={{animationDelay: '0.6s'}}>
            ✅ Grátis para sempre • ✅ Sem cartão de crédito • ✅ Resultados em 15 minutos
          </p>

          {/* Enhanced Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto animate-slide-up" style={{animationDelay: '0.8s'}}>
            {stats.map((stat, index) => (
              <Card key={index} className={`p-6 bg-gradient-to-br ${stat.color} text-white border-0 hover-lift`}>
                <div className="flex items-center justify-center mb-3 text-white/80">
                  {stat.icon}
                </div>
                <div className="text-2xl md:text-3xl font-bold mb-2">{stat.value}</div>
                <div className="text-xs text-white/80">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section id="problemas" className="py-24 px-4 bg-gradient-to-r from-red-50/80 to-orange-50/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="destructive" className="mb-6">😰 Problemas Reais</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Você Reconhece Estes
              <span className="text-red-600"> Problemas</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Se você responder "SIM" para qualquer um destes, o VigIA vai mudar sua vida
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {painPoints.map((pain, index) => (
              <Card key={index} className="group relative overflow-hidden hover-lift bg-white/80 backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-100/50 to-red-200/50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                <CardHeader className="relative z-10">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                    {pain.icon}
                  </div>
                  <CardTitle className="text-xl mb-4">{pain.title}</CardTitle>
                  <Badge variant="destructive" className="w-fit mb-4">
                    {pain.impact}
                  </Badge>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-gray-600 text-base leading-relaxed">
                    {pain.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-16">
            <Card className="p-8 bg-gradient-to-r from-red-600/10 to-orange-600/10 max-w-3xl mx-auto hover-lift">
              <h3 className="text-3xl font-bold text-red-700 mb-4">
                💸 Resultado: Você gasta R$ 3.600+ a mais por ano
              </h3>
              <p className="text-gray-700 text-lg">
                Isso é dinheiro suficiente para uma viagem incrível ou uma reserva de emergência. 
                <strong> Tempo de mudar isso, não acha?</strong>
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solucao" className="py-24 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="success" className="mb-6">✨ A Solução</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Como o VigIA Te Faz
              <span className="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent"> Economizar</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sistema inteligente com IA que trabalha 24h para você pagar menos
            </p>
          </div>

          {/* Interactive Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`group relative overflow-hidden hover-lift cursor-pointer transition-all duration-500 ${
                  activeFeature === index ? 'ring-4 ring-blue-300 scale-105' : ''
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg mb-3">{feature.title}</CardTitle>
                  <Badge variant="success" className="w-fit mb-4 animate-pulse">
                    {feature.benefit}
                  </Badge>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Alert Channels */}
          <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-xl">
            <h3 className="text-2xl font-bold text-center mb-6">📱 Receba Alertas em Todos os Canais</h3>
            <div className="flex flex-wrap justify-center gap-6">
              {alertChannels.map((channel, index) => (
                <div key={index} className="flex items-center gap-3 bg-white rounded-xl px-6 py-4 shadow-md hover-lift">
                  <div className={channel.color}>
                    {channel.icon}
                  </div>
                  <span className="font-semibold text-gray-800">{channel.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="resultados" className="py-24 px-4 bg-gradient-to-r from-green-50/80 to-blue-50/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="success" className="mb-6">🏆 Resultados Reais</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Veja Quanto Nossos Usuários
              <span className="text-green-600"> Economizaram</span>
            </h2>
            <p className="text-xl text-gray-600">
              Histórias reais de pessoas que mudaram sua forma de comprar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative overflow-hidden hover-lift bg-white/90 backdrop-blur-sm">
                <div className="absolute top-4 right-4">
                  <Badge variant="success" className="text-xs font-bold">
                    Economizou {testimonial.savings}
                  </Badge>
                </div>
                <CardHeader>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <LucideStar key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-gray-700 text-base leading-relaxed mb-6">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{testimonial.avatar}</div>
                    <div>
                      <div className="font-bold text-gray-800">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Section */}
      <section id="planos" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-6">💰 Planos Simples</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Invista Pouco para Economizar
              <span className="text-green-600"> Muito</span>
            </h2>
            <p className="text-xl text-gray-600 mb-4">
              ROI médio de 1.500% nos primeiros 30 dias
            </p>
            <p className="text-lg text-gray-500">
              Escolha o plano ideal para seu perfil de compras
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Free Plan */}
            <Card className="relative hover-lift border-2 border-gray-200">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <LucideTarget className="w-8 h-8 text-gray-600" />
                </div>
                <CardTitle className="text-2xl mb-2">Teste Grátis</CardTitle>
                <div className="text-4xl font-bold text-gray-800 mt-4">
                  R$ 0
                  <span className="text-lg font-normal text-gray-500">/sempre</span>
                </div>
                <CardDescription className="mt-2">Prove o resultado antes de pagar</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {[
                    "5 produtos monitorados",
                    "Alertas por email",
                    "Histórico de 30 dias",
                    "Análise básica de preços"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <FaCheckCircle className="text-green-500 text-sm flex-shrink-0" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.location.href = "/login"}
                >
                  Começar Teste Grátis
                </Button>
                <p className="text-xs text-center text-gray-500 mt-3">
                  Sem cartão • Sem compromisso
                </p>
              </CardContent>
            </Card>

            {/* Starter Plan */}
            <Card className="relative hover-lift border-2 border-blue-300 bg-gradient-to-br from-blue-50/50 to-blue-100/30">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge variant="default" className="bg-gradient-to-r from-blue-600 to-blue-700">
                  💡 Ideal para Iniciantes
                </Badge>
              </div>
              <CardHeader className="text-center pb-4 pt-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <LucideZap className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-2">VigIA Starter</CardTitle>
                <div className="text-4xl font-bold text-blue-700 mt-4">
                  R$ 9,90
                  <span className="text-lg font-normal text-gray-500">/mês</span>
                </div>
                <CardDescription className="mt-2">Perfeito para uso pessoal</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {[
                    "25 produtos monitorados",
                    "Alertas WhatsApp + Email",
                    "Histórico completo + Gráficos",
                    "IA para análise básica",
                    "Detector de cupons",
                    "Análise de vendedores"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <FaCheckCircle className="text-blue-500 text-sm flex-shrink-0" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  onClick={() => window.location.href = "/login"}
                >
                  Começar com 7 Dias Grátis
                </Button>
                <p className="text-xs text-center text-gray-500 mt-3">
                  Cancele quando quiser • Garantia 15 dias
                </p>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative hover-lift border-2 border-green-300 bg-gradient-to-br from-green-50/50 to-green-100/30 scale-105">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge variant="premium">
                  <FaCrown className="mr-1 w-3 h-3" /> Mais Escolhido
                </Badge>
              </div>
              <CardHeader className="text-center pb-4 pt-8">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <LucideRocket className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-2">VigIA Pro</CardTitle>
                <div className="text-4xl font-bold text-green-700 mt-4">
                  R$ 19,90
                  <span className="text-lg font-normal text-gray-500">/mês</span>
                </div>
                <CardDescription className="mt-2">Se paga na primeira compra</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {[
                    "Produtos ILIMITADOS",
                    "Alertas: WhatsApp + Telegram + SMS + Email",
                    "IA Avançada + Insights Personalizados", 
                    "Análise completa de vendedores",
                    "Cupons exclusivos + Cashback",
                    "Suporte prioritário 24h",
                    "Dashboard personalizado"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <FaCheckCircle className="text-green-500 text-sm flex-shrink-0" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant="success"
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  onClick={() => window.location.href = "/login"}
                >
                  Começar com 7 Dias Grátis
                </Button>
                <p className="text-xs text-center text-gray-500 mt-3">
                  Cancele quando quiser • Garantia 30 dias
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-16">
            <Card className="p-8 bg-gradient-to-r from-green-600/10 to-green-700/10 max-w-3xl mx-auto hover-lift">
              <h3 className="text-3xl font-bold text-green-700 mb-4">
                🎯 Garantia de Resultado
              </h3>
              <p className="text-gray-700 text-lg">
                Se você não economizar pelo menos <strong>R$ 50 nos primeiros 30 dias</strong>, 
                devolvemos 100% do seu dinheiro. Sem perguntas.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-5xl mx-auto text-center text-white relative z-10">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <LucideSparkles className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Chega de Pagar Caro por Produtos do Mercado Livre
          </h2>
          <p className="text-xl mb-12 opacity-90 max-w-3xl mx-auto">
            Junte-se a mais de 25.000 brasileiros que já economizam com nossa tecnologia
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Button 
              size="xl" 
              variant="secondary"
              className="group bg-white text-blue-700 hover:bg-gray-100 shadow-2xl"
              onClick={() => window.location.href = "/login"}
            >
              <LucideRocket className="mr-3 w-6 h-6 group-hover:scale-110 transition-transform" />
              Começar Grátis Agora
              <LucideArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 text-sm opacity-80">
            <span className="flex items-center gap-2">
              <LucideUsers className="w-4 h-4" />
              25.000+ usuários ativos
            </span>
            <span className="flex items-center gap-2">
              <FaMoneyBillWave className="w-4 h-4" />
              R$ 4,2M economizados
            </span>
            <span className="flex items-center gap-2">
              <LucideStar className="w-4 h-4" />
              Nota 4.9/5 estrelas
            </span>
            <span className="flex items-center gap-2">
              <LucideShield className="w-4 h-4" />
              Grátis para sempre
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <FaShoppingCart className="text-white text-xl" />
              </div>
              <span className="text-2xl font-bold text-white">
                VigIA
              </span>
            </div>
            <div className="text-gray-400 text-center md:text-right">
              <p className="mb-2">Desenvolvido com ❤️ para economizar dinheiro dos brasileiros</p>
              <p className="text-sm">© 2024 VigIA. Todos os direitos reservados.</p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              🚀 Transformando a forma como os brasileiros compram online desde 2024
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}