"use client";
import { FaCheckCircle, FaGoogle, FaEnvelope, FaCrown, FaShoppingCart, FaBell, FaChartLine } from "react-icons/fa";
import { LucideArrowRight, LucideZap, LucideShield, LucideTrendingUp, LucideUsers, LucideStar } from "lucide-react";
import { Button } from "./components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/Card";
import { Badge } from "./components/ui/Badge";
import { signIn } from "next-auth/react";

export default function Home() {
  const features = [
    {
      icon: <LucideTrendingUp className="w-6 h-6" />,
      title: "Monitoramento em Tempo Real",
      description: "Acompanhe preços 24/7 com atualizações automáticas a cada 30 minutos"
    },
    {
      icon: <FaBell className="w-6 h-6" />,
      title: "Alertas Inteligentes",
      description: "Receba notificações por email quando o preço atingir seu valor desejado"
    },
    {
      icon: <FaChartLine className="w-6 h-6" />,
      title: "Gráficos e Histórico",
      description: "Visualize tendências de preço com gráficos interativos e dados históricos"
    },
    {
      icon: <LucideZap className="w-6 h-6" />,
      title: "IA para Avaliações",
      description: "Resumos automáticos de avaliações usando inteligência artificial"
    },
    {
      icon: <LucideShield className="w-6 h-6" />,
      title: "100% Seguro",
      description: "Seus dados protegidos com autenticação Google e criptografia"
    },
    {
      icon: <LucideUsers className="w-6 h-6" />,
      title: "Multi-usuário",
      description: "Cada usuário tem seu próprio dashboard personalizado"
    }
  ];

  const testimonials = [
    {
      name: "Carlos Silva",
      role: "Revendedor",
      content: "Economizei mais de R$ 2.000 em compras usando o VigIA. Indispensável!",
      rating: 5
    },
    {
      name: "Maria Santos",
      role: "Empreendedora",
      content: "A funcionalidade de alertas é perfeita. Nunca mais perco uma promoção.",
      rating: 5
    },
    {
      name: "João Oliveira",
      role: "Comprador",
      content: "Interface simples e intuitiva. Recomendo para todos os brasileiros.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Floating Header */}
      <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100/60">
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
            <a href="#recursos" className="text-blue-700 font-medium hover:text-blue-800 transition-colors">Recursos</a>
            <a href="#planos" className="text-blue-700 font-medium hover:text-blue-800 transition-colors">Planos</a>
            <a href="#depoimentos" className="text-blue-700 font-medium hover:text-blue-800 transition-colors">Depoimentos</a>
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
          <Badge variant="secondary" className="mb-6 text-blue-700 bg-blue-100/80">
            🚀 Novo: Resumos de avaliações com IA
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
              Monitore Preços
            </span>
            <br />
            <span className="text-gray-800">Como um Profissional</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Automatize o acompanhamento de preços no Mercado Livre com alertas inteligentes, 
            gráficos detalhados e insights gerados por IA. Economize tempo e dinheiro.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="xl" 
              className="group"
              onClick={() => signIn("google")}
            >
              <FaGoogle className="mr-2" />
              Começar Gratuitamente
              <LucideArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="xl">
              <FaEnvelope className="mr-2" />
              Ver Demonstração
            </Button>
          </div>

          {/* Hero Image/Stats */}
          <div className="relative">
            <Card className="p-8 max-w-4xl mx-auto bg-gradient-to-r from-blue-600/5 to-blue-700/5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-700 mb-2">15K+</div>
                  <div className="text-gray-600">Produtos Monitorados</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-700 mb-2">R$ 2M+</div>
                  <div className="text-gray-600">Economizados pelos Usuários</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-700 mb-2">99.9%</div>
                  <div className="text-gray-600">Uptime Garantido</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Recursos</Badge>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Tudo que você precisa para
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent"> economizar</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ferramentas profissionais para monitoramento inteligente de preços
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
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
            <Badge variant="secondary" className="mb-4">Planos</Badge>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Escolha o plano ideal para você
            </h2>
            <p className="text-xl text-gray-600">
              Comece grátis e evolua conforme sua necessidade
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Gratuito</CardTitle>
                <div className="text-4xl font-bold text-gray-800 mt-4">
                  R$ 0
                  <span className="text-lg font-normal text-gray-500">/mês</span>
                </div>
                <CardDescription>Perfeito para começar</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "Até 5 produtos monitorados",
                    "Alertas por email",
                    "Histórico de 30 dias",
                    "Suporte por email"
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
                  Começar Grátis
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-blue-300 bg-gradient-to-br from-blue-50/50 to-blue-100/30">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <FaCrown className="mr-1" /> Mais Popular
                </Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <div className="text-4xl font-bold text-blue-700 mt-4">
                  R$ 19,90
                  <span className="text-lg font-normal text-gray-500">/mês</span>
                </div>
                <CardDescription>Para usuários avançados</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "Produtos ilimitados",
                    "Alertas instantâneos",
                    "Histórico completo",
                    "Resumos com IA",
                    "Gráficos avançados",
                    "Suporte prioritário",
                    "API de integração"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <FaCheckCircle className="text-green-500 text-sm" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full mt-6"
                  onClick={() => signIn("google")}
                >
                  Começar Teste Grátis
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-20 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Depoimentos</Badge>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              O que nossos usuários dizem
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <LucideStar key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-gray-700">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="font-semibold text-gray-800">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="p-12 bg-gradient-to-r from-blue-600/10 to-blue-700/10">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Pronto para economizar?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Junte-se a milhares de brasileiros que já economizam com o VigIA
            </p>
            <Button 
              size="xl" 
              className="group"
              onClick={() => signIn("google")}
            >
              <FaGoogle className="mr-2" />
              Começar Agora Grátis
              <LucideArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Card>
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
              <p>Desenvolvido com ❤️ para a comunidade brasileira</p>
              <p className="text-sm mt-1">© 2024 VigIA. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}