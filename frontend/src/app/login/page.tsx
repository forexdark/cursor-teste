"use client";
import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaGoogle, FaEnvelope, FaEye, FaEyeSlash, FaShoppingCart, FaLock, FaUserPlus } from "react-icons/fa";
import { LucideArrowRight, LucideShield, LucideZap, LucideHeart, LucideArrowLeft } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export default function Login() {
  const sessionData = useSession();
  const session = sessionData?.data || null;
  const status = sessionData?.status || "loading";
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already authenticated
  if (status === "authenticated") {
    router.push("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Login with email/password
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError("Email ou senha incorretos");
        } else {
          router.push("/dashboard");
        }
      } else {
        // Register new account
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            senha: formData.password,
            nome: formData.name,
          }),
        });

        if (response.ok) {
          // Auto login after registration
          const result = await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            redirect: false,
          });

          if (!result?.error) {
            router.push("/dashboard");
          }
        } else {
          const data = await response.json();
          setError(data.detail || "Erro ao criar conta");
        }
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const benefits = [
    {
      icon: <LucideZap className="w-5 h-5 text-yellow-500" />,
      text: "Alertas instantâneos de promoções"
    },
    {
      icon: <LucideShield className="w-5 h-5 text-green-500" />,
      text: "100% gratuito para sempre"
    },
    {
      icon: <LucideHeart className="w-5 h-5 text-red-500" />,
      text: "Economize centenas por mês"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 relative">
      {/* Back to Home Button */}
      <div className="absolute top-6 left-6">
        <Button
          variant="ghost"
          onClick={() => window.location.href = "/"}
          className="group"
        >
          <LucideArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar ao Início
        </Button>
      </div>

      <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Branding & Benefits */}
        <div className="hidden lg:block space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <FaShoppingCart className="text-white text-xl" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                VigIA
              </span>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Pare de Pagar Caro no
              <span className="text-blue-600"> Mercado Livre</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Monitore preços automaticamente e receba alertas quando seus produtos favoritos ficarem mais baratos.
            </p>
          </div>

          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  {benefit.icon}
                </div>
                <span className="text-gray-700 font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>

          <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <div className="text-center">
              <Badge variant="success" className="mb-3">
                Resultado Médio dos Usuários
              </Badge>
              <div className="text-3xl font-bold text-green-700 mb-2">47% de Economia</div>
              <p className="text-green-600">por compra monitorada</p>
            </div>
          </Card>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="p-8">
            <CardHeader className="text-center space-y-4">
              {/* Mobile branding */}
              <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <FaShoppingCart className="text-white text-sm" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  VigIA
                </span>
              </div>

              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {isLogin ? (
                  <FaLock className="text-white text-xl" />
                ) : (
                  <FaUserPlus className="text-white text-xl" />
                )}
              </div>

              <CardTitle className="text-3xl font-bold">
                {isLogin ? "Entrar na Conta" : "Criar Conta Grátis"}
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? "Acesse seu dashboard de monitoramento" 
                  : "Comece a economizar hoje mesmo"
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Google Sign In */}
              <Button
                type="button"
                className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl group"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <FaGoogle className="mr-3 group-hover:scale-110 transition-transform" />
                {isLogin ? "Entrar" : "Criar conta"} com Google
                <LucideArrowRight className="ml-auto w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 py-1 text-gray-500 font-medium rounded-full border border-gray-300">
                    ou continue com email
                  </span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <FaUserPlus className="w-4 h-4" />
                        Nome completo
                      </div>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
                      placeholder="Seu nome"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="w-4 h-4" />
                      Email
                    </div>
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <FaLock className="w-4 h-4" />
                      Senha
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                  {!isLogin && (
                    <p className="text-xs text-gray-500 mt-1">
                      Mínimo 6 caracteres • Use letras e números para maior segurança
                    </p>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl group"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processando...
                    </div>
                  ) : (
                    <>
                      {isLogin ? <FaLock className="mr-2" /> : <FaUserPlus className="mr-2" />}
                      {isLogin ? "Entrar na Conta" : "Criar Conta Grátis"}
                      <LucideArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              {/* Toggle Form Type */}
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-gray-600">
                  {isLogin ? "Ainda não tem conta?" : "Já tem conta?"}
                  <button
                    type="button"
                    className="ml-2 text-blue-600 hover:text-blue-700 font-bold hover:underline transition-all"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError("");
                      setFormData({ email: "", password: "", name: "" });
                    }}
                  >
                    {isLogin ? "Criar conta grátis" : "Fazer login"}
                  </button>
                </p>
              </div>

              {/* Security Note */}
              <div className="text-center bg-green-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">
                  🔒 Seus dados estão protegidos com criptografia SSL e nunca serão compartilhados
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Benefits */}
          <div className="lg:hidden mt-8 space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                  {benefit.icon}
                </div>
                <span className="text-gray-700 text-sm">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}