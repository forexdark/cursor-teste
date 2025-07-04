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
  const [message, setMessage] = useState('Processando autorização do Mercado Livre...');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    const processCallback = async () => {
      try {
        setDebugInfo(prev => [...prev, '🔄 Iniciando processamento do callback']);
        
        // Obter código e state da URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        setDebugInfo(prev => [...prev, `📋 Parâmetros: code=${code ? 'presente' : 'ausente'}, state=${state ? 'presente' : 'ausente'}, error=${error || 'nenhum'}`]);

        // Se houve erro no OAuth
        if (error) {
          setDebugInfo(prev => [...prev, `❌ Erro OAuth: ${error}`]);
          setStatus('error');
          setMessage(`Erro na autorização: ${error}`);
          setTimeout(() => window.close(), 3000);
          return;
        }

        // Se não tem código, houve problema
        if (!code) {
          setDebugInfo(prev => [...prev, '❌ Código de autorização não encontrado na URL']);
          setStatus('error');
          setMessage('Código de autorização não encontrado');
          setTimeout(() => window.close(), 3000);
          return;
        }

        // Se não tem JWT do backend, usuário não está logado
        if (!backendJwt) {
          setDebugInfo(prev => [...prev, '❌ Token JWT não encontrado']);
          setStatus('error');
          setMessage('Sessão expirada. Faça login novamente.');
          setTimeout(() => {
            window.opener?.location.reload();
            window.close();
          }, 3000);
          return;
        }

        setDebugInfo(prev => [...prev, `🔄 Enviando para backend: code=${code.substring(0, 10)}..., state=${state?.substring(0, 10)}...`]);

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

        setDebugInfo(prev => [...prev, `📡 Response status: ${response.status}`]);
        if (response.ok) {
          const data = await response.json();
          setDebugInfo(prev => [...prev, '✅ Callback processado com sucesso']);
          
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
          setDebugInfo(prev => [...prev, `❌ Erro ${response.status}: ${JSON.stringify(errorData)}`]);
          
          setStatus('error');
          setMessage(errorData.detail || `Erro no servidor: ${response.status}`);
          
          setTimeout(() => window.close(), 3000);
        }

      } catch (error) {
        setDebugInfo(prev => [...prev, `❌ Erro de rede: ${error}`]);
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
            <h1 className="text-xl font-bold text-gray-800">OAuth 2.0 + PKCE</h1>
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
              {/* Debug info em desenvolvimento */}
              {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
                <details className="mb-4 text-left">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    OAuth 2.0 Debug Info (desenvolvimento)
                  </summary>
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono max-h-32 overflow-y-auto">
                    {debugInfo.map((info, index) => (
                      <div key={index} className="text-gray-700">{info}</div>
                    ))}
                  </div>
                </details>
              )}
              
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