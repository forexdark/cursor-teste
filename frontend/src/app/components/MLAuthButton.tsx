"use client";
import { useState } from "react";
import { Button } from "./ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { LucideShield, LucideExternalLink, LucideCheck, LucideX, LucideLoader, LucideZap, LucideKey } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";

interface MLAuthButtonProps {
  onAuthSuccess?: () => void;
  compact?: boolean;
}

export default function MLAuthButton({ onAuthSuccess, compact = false }: MLAuthButtonProps) {
  const { backendJwt } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<'unknown' | 'authorized' | 'unauthorized'>('unknown');
  const [error, setError] = useState<string | null>(null);

  // Verificar status da autorização
  const checkAuthStatus = async () => {
    if (!backendJwt) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/mercadolivre/status`, {
        headers: { Authorization: `Bearer ${backendJwt}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuthStatus(data.authorized ? 'authorized' : 'unauthorized');
      }
    } catch (error) {
      console.error("Erro ao verificar status ML:", error);
      setAuthStatus('unauthorized');
    }
  };

  // Iniciar autorização OAuth
  const handleAuthorize = async () => {
    if (!backendJwt) {
      setError("Você precisa estar logado para autorizar o Mercado Livre");
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
          // Redirecionar para autorização do ML
          window.open(data.auth_url, '_blank', 'width=600,height=700');
          
          // Aguardar callback (simulação - em produção, usar WebSocket ou polling)
          setTimeout(() => {
            checkAuthStatus();
            if (onAuthSuccess) onAuthSuccess();
          }, 3000);
        } else {
          setError("Erro ao gerar URL de autorização");
        }
      } else {
        setError("Erro ao conectar com o servidor");
      }
    } catch (error) {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  // Revogar autorização
  const handleRevoke = async () => {
    if (!backendJwt) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/mercadolivre/revoke`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${backendJwt}` }
      });

      if (response.ok) {
        setAuthStatus('unauthorized');
      }
    } catch (error) {
      console.error("Erro ao revogar autorização:", error);
    }
  };

  // Verificar status na montagem do componente
  useState(() => {
    checkAuthStatus();
  });

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {authStatus === 'authorized' ? (
          <Badge variant="success" className="flex items-center gap-2">
            <LucideCheck className="w-3 h-3" />
            ML Autorizado
          </Badge>
        ) : (
          <Button
            onClick={handleAuthorize}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            {loading ? (
              <LucideLoader className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <LucideKey className="w-4 h-4 mr-2" />
            )}
            Autorizar ML
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
        </CardTitle>
        <CardDescription className="text-orange-600">
          Para buscar produtos reais e obter preços atualizados
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <LucideLoader className="w-5 h-5 animate-spin mr-2" />
                  Gerando autorização...
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