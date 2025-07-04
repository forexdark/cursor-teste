"use client";
import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { LucideShield, LucideExternalLink, LucideCheck, LucideX, LucideLoader, LucideZap, LucideKey, LucideWifi, LucideWifiOff } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";

interface MLAuthButtonProps {
  onAuthSuccess?: () => void;
  compact?: boolean;
}

export default function MLAuthButton({ onAuthSuccess, compact = false }: MLAuthButtonProps) {
  const { backendJwt, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<'unknown' | 'authorized' | 'unauthorized'>('unknown');
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Verificar se o backend está online
  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
      const isOnline = response.ok;
      setBackendOnline(isOnline);
      return isOnline;
    } catch (error) {
      setBackendOnline(false);
      return false;
    }
  };

  // Verificar status da autorização ML
  const checkAuthStatus = async () => {
    if (!backendJwt) {
      setAuthStatus('unauthorized');
      return;
    }
    
    const isOnline = await checkBackendStatus();
    if (!isOnline) {
      setError("Backend temporariamente indisponível");
      return;
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/mercadolivre/status`, {
        headers: { Authorization: `Bearer ${backendJwt}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuthStatus(data.authorized ? 'authorized' : 'unauthorized');
        setError(null);
      } else {
        setAuthStatus('unauthorized');
        if (response.status === 401) {
          setError("Sessão expirada. Faça login novamente.");
        }
      }
    } catch (error) {
      console.error("Erro ao verificar status ML:", error);
      setAuthStatus('unauthorized');
      setError("Erro de conexão com o servidor");
    }
  };

  // Iniciar autorização OAuth do ML
  const handleAuthorize = async () => {
    if (!backendJwt) {
      setError("Você precisa estar logado para autorizar o Mercado Livre");
      return;
    }

    const isOnline = await checkBackendStatus();
    if (!isOnline) {
      setError("Backend temporariamente indisponível. Tente novamente em alguns momentos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Obter URL de autorização
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/mercadolivre/url`, {
        headers: { Authorization: `Bearer ${backendJwt}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.auth_url) {
          // Abrir popup para autorização
          const popup = window.open(
            data.auth_url, 
            'ml-auth', 
            'width=600,height=700,scrollbars=yes,resizable=yes'
          );
          
          // Monitorar fechamento do popup
          const checkClosed = setInterval(() => {
            if (popup?.closed) {
              clearInterval(checkClosed);
              // Aguardar um pouco e verificar status
              setTimeout(() => {
                checkAuthStatus();
                if (onAuthSuccess) onAuthSuccess();
              }, 2000);
            }
          }, 1000);
          
          // Timeout para fechar popup automaticamente
          setTimeout(() => {
            if (popup && !popup.closed) {
              popup.close();
              clearInterval(checkClosed);
            }
          }, 300000); // 5 minutos
          
        } else {
          setError("Erro ao gerar URL de autorização");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || "Erro ao conectar com o servidor");
      }
    } catch (error) {
      setError("Erro de conexão com o servidor");
      console.error("Erro ao autorizar ML:", error);
    } finally {
      setLoading(false);
    }
  };

  // Revogar autorização
  const handleRevoke = async () => {
    if (!backendJwt) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/mercadolivre/revoke`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${backendJwt}` }
      });

      if (response.ok) {
        setAuthStatus('unauthorized');
        setError(null);
      } else {
        setError("Erro ao revogar autorização");
      }
    } catch (error) {
      console.error("Erro ao revogar autorização:", error);
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  // Verificar status na montagem
  useEffect(() => {
    if (backendJwt) {
      checkAuthStatus();
    } else {
      setAuthStatus('unauthorized');
    }
  }, [backendJwt]);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Status do Backend */}
        <div className="flex items-center gap-2">
          {backendOnline === true ? (
            <LucideWifi className="w-4 h-4 text-green-500" />
          ) : backendOnline === false ? (
            <LucideWifiOff className="w-4 h-4 text-red-500" />
          ) : (
            <LucideLoader className="w-4 h-4 animate-spin text-gray-500" />
          )}
        </div>

        {/* Status da Autorização ML */}
        {authStatus === 'authorized' ? (
          <Badge variant="success" className="flex items-center gap-2">
            <LucideCheck className="w-3 h-3" />
            ML Autorizado
          </Badge>
        ) : (
          <Button
            onClick={handleAuthorize}
            disabled={loading || backendOnline === false}
            variant="outline"
            size="sm"
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            {loading ? (
              <LucideLoader className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <LucideKey className="w-4 h-4 mr-2" />
            )}
            {backendOnline === false ? "Backend Offline" : "Autorizar ML"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-50 to-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <LucideShield className="w-5 h-5" />
          Autorização Mercado Livre
          {backendOnline === true ? (
            <LucideWifi className="w-4 h-4 text-green-500 ml-auto" />
          ) : backendOnline === false ? (
            <LucideWifiOff className="w-4 h-4 text-red-500 ml-auto" />
          ) : (
            <LucideLoader className="w-4 h-4 animate-spin text-gray-500 ml-auto" />
          )}
        </CardTitle>
        <CardDescription className="text-orange-600">
          Para buscar produtos reais e obter preços atualizados
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Status do Backend */}
        {backendOnline === false && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <LucideWifiOff className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Backend Offline</span>
            </div>
            <p className="text-red-600 text-sm mt-1">
              O servidor está temporariamente indisponível. Tente novamente em alguns momentos.
            </p>
            <Button
              onClick={checkBackendStatus}
              variant="outline"
              size="sm"
              className="mt-2 border-red-300 text-red-700 hover:bg-red-50"
            >
              Tentar Novamente
            </Button>
          </div>
        )}

        {authStatus === 'authorized' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <LucideCheck className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">Autorização Ativa</p>
                <p className="text-sm text-green-600">Você pode buscar produtos reais do Mercado Livre</p>
              </div>
            </div>
            <Button
              onClick={handleRevoke}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-50"
              disabled={loading}
            >
              <LucideX className="w-4 h-4 mr-2" />
              Revogar Autorização
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <LucideZap className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800 mb-2">Autorização Necessária</p>
                <p className="text-sm text-yellow-700 mb-3">
                  Para acessar dados completos do Mercado Livre, você precisa autorizar nossa aplicação.
                </p>
                <ul className="text-xs text-yellow-600 space-y-1">
                  <li>✓ Preços e estoques em tempo real</li>
                  <li>✓ Dados completos dos produtos</li>
                  <li>✓ Informações de vendedores</li>
                  <li>✓ Avaliações e comentários</li>
                </ul>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <Button
              onClick={handleAuthorize}
              disabled={loading || backendOnline === false || !backendJwt}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <LucideLoader className="w-5 h-5 animate-spin mr-2" />
                  Gerando autorização...
                </>
              ) : backendOnline === false ? (
                <>
                  <LucideWifiOff className="w-5 h-5 mr-2" />
                  Backend Offline
                </>
              ) : !backendJwt ? (
                <>
                  <LucideKey className="w-5 h-5 mr-2" />
                  Faça Login Primeiro
                </>
              ) : (
                <>
                  <LucideExternalLink className="w-5 h-5 mr-2" />
                  Autorizar Mercado Livre
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              🔒 Sua autorização é segura e pode ser revogada a qualquer momento
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}