"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../../providers/AuthProvider";
import { FaShoppingCart } from "react-icons/fa";
import { Card, CardContent } from "../../../components/ui/Card";
import { LucideCheck, LucideX, LucideLoader, LucideShoppingCart } from "lucide-react";

export default function MercadoLivreCallback() {
  const searchParams = useSearchParams();
  const { backendJwt } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processando autorização...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Obter código e state da URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Se houve erro no OAuth
        if (error) {
          setStatus('error');
          setMessage(`Erro na autorização: ${error}`);
          setTimeout(() => window.close(), 3000);
          return;
        }

        // Se não tem código, houve problema
        if (!code) {
          setStatus('error');
          setMessage('Código de autorização não encontrado');
          setTimeout(() => window.close(), 3000);
          return;
        }

        // Se não tem JWT do backend, usuário não está logado
        if (!backendJwt) {
          setStatus('error');
          setMessage('Sessão expirada. Faça login novamente.');
          setTimeout(() => {
            window.opener?.location.reload();
            window.close();
          }, 3000);
          return;
        }

        console.log('🔄 Processando callback ML...', { code: code.substring(0, 20) + '...', state });

        // Enviar código para o backend processar
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/mercadolivre/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${backendJwt}`
          },
          body: JSON.stringify({
            code: code,
            state: state
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Callback processado com sucesso:', data);
          
          setStatus('success');
          setMessage('Autorização concluída com sucesso!');

          // Aguardar 2 segundos e fechar popup
          setTimeout(() => {
            // Tentar recarregar a página pai para atualizar o status
            if (window.opener) {
              try {
                window.opener.postMessage({ 
                  type: 'ML_AUTH_SUCCESS',
                  data: data 
                }, window.origin);
              } catch (e) {
                // Se não conseguir enviar mensagem, tentar recarregar
                window.opener.location.reload();
              }
            }
            window.close();
          }, 2000);

        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Erro no callback:', response.status, errorData);
          
          setStatus('error');
          setMessage(errorData.detail || `Erro no servidor: ${response.status}`);
          
          setTimeout(() => window.close(), 3000);
        }

      } catch (error) {
        console.error('❌ Erro ao processar callback:', error);
        setStatus('error');
        setMessage('Erro de conexão. Tente novamente.');
        setTimeout(() => window.close(), 3000);
      }
    };

    processCallback();
  }, [searchParams, backendJwt]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center shadow-2xl">
        <CardContent className="p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center">
            {status === 'processing' && (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <LucideLoader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <LucideCheck className="w-8 h-8 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <LucideX className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <FaShoppingCart className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl font-bold text-gray-800">Mercado Livre</h1>
          </div>

          <p className={`text-sm ${
            status === 'success' ? 'text-green-700' : 
            status === 'error' ? 'text-red-700' : 
            'text-blue-700'
          }`}>
            {message}
          </p>

          {status === 'processing' && (
            <div className="mt-4">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-4 text-xs text-gray-500">
              Esta janela fechará automaticamente...
            </div>
          )}

          {status === 'error' && (
            <div className="mt-4">
              <button
                onClick={() => window.close()}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Fechar janela
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}