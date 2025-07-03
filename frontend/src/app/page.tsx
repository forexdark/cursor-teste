"use client";
import { FaCheckCircle, FaGoogle, FaEnvelope, FaCrown } from "react-icons/fa";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <header className="w-full flex justify-between items-center px-6 py-4 bg-white shadow-sm">
        <span className="text-2xl font-bold text-blue-700">VigIA</span>
        <nav className="flex gap-6">
          <a href="/dashboard" className="text-blue-700 font-medium hover:underline">Dashboard</a>
          <a href="/adicionar-produto" className="text-blue-700 font-medium hover:underline">Adicionar</a>
          <a href="/alertas" className="text-blue-700 font-medium hover:underline">Alertas</a>
          <a href="/perfil" className="text-blue-700 font-medium hover:underline">Perfil</a>
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-xl w-full mt-10">
          <h1 className="text-4xl font-extrabold text-blue-900 text-center mb-2">VigIA</h1>
          <p className="text-center text-blue-700 mb-6 text-lg font-medium">
            Monitoramento Inteligente de Preços do Mercado Livre
          </p>
          <ul className="mb-8 space-y-2">
            {[
              "Acompanhe preços em tempo real",
              "Receba alertas automáticos quando o preço baixar",
              "Veja histórico de preços e gráficos",
              "Resumos de avaliações com IA",
              "Dashboard completo e fácil de usar",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-gray-700">
                <FaCheckCircle className="text-green-500" /> {item}
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow transition">
              <FaGoogle /> Entrar com Google
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-blue-700 font-semibold py-3 rounded-lg shadow transition">
              <FaEnvelope /> Entrar com Email
            </button>
          </div>
          <div>
            <h2 className="text-center text-blue-900 font-bold mb-4">Planos</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col items-center">
                <span className="font-bold text-blue-700">Gratuito</span>
                <span className="text-2xl font-extrabold text-blue-900">R$ 0</span>
                <span className="text-gray-600 text-sm">Até 5 produtos</span>
              </div>
              <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex flex-col items-center">
                <span className="font-bold text-yellow-700 flex items-center gap-1">
                  <FaCrown /> Pro
                </span>
                <span className="text-2xl font-extrabold text-yellow-900">R$ 19,90/mês</span>
                <span className="text-gray-600 text-sm">Produtos ilimitados + recursos avançados</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-gray-400 text-sm py-4 mt-8">
        Desenvolvido para a comunidade brasileira de e-commerce.
      </footer>
    </div>
  );
}
