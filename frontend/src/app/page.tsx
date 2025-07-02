import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-4xl font-bold text-blue-900 mb-4 text-center">VigIA</h1>
        <h2 className="text-xl text-blue-700 mb-6 text-center">Monitoramento Inteligente de Preços do Mercado Livre</h2>
        <ul className="text-gray-700 mb-6 space-y-2 text-lg">
          <li>✅ Acompanhe preços em tempo real</li>
          <li>✅ Receba alertas automáticos quando o preço baixar</li>
          <li>✅ Veja histórico de preços e gráficos</li>
          <li>✅ Resumos de avaliações com IA</li>
          <li>✅ Dashboard completo e fácil de usar</li>
        </ul>
        <div className="flex flex-col items-center gap-4 w-full">
          <Link href="/dashboard" className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg w-full text-center transition">Comece Agora (Login Google)</Link>
          <div className="w-full flex flex-col items-center mt-4">
            <span className="font-semibold text-blue-900 mb-2">Planos</span>
            <div className="flex flex-col md:flex-row gap-4 w-full justify-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-1 text-center">
                <span className="block font-bold text-blue-700">Gratuito</span>
                <span className="block text-2xl font-bold">R$ 0</span>
                <span className="block text-gray-600">Até 5 produtos</span>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex-1 text-center">
                <span className="block font-bold text-yellow-700">Pro</span>
                <span className="block text-2xl font-bold">R$ 19,90/mês</span>
                <span className="block text-gray-600">Produtos ilimitados + recursos avançados</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-8 text-center">Desenvolvido para a comunidade brasileira de e-commerce.</p>
      </div>
    </main>
  );
}
