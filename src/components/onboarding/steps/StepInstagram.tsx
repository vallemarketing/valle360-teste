'use client';

import { useState } from 'react';
import { Instagram, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StepInstagramProps {
  data: {
    instagram_connected: boolean;
    instagram_username: string;
  };
  onChange: (data: any) => void;
}

export function StepInstagram({ data, onChange }: StepInstagramProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [username, setUsername] = useState(data.instagram_username || '');
  const [isConnected, setIsConnected] = useState(data.instagram_connected || false);

  const handleConnect = async () => {
    if (!username.trim()) return;
    
    setIsConnecting(true);
    
    // Simulação - Em produção, isso seria OAuth real com Meta
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsConnected(true);
    onChange({ 
      instagram_connected: true, 
      instagram_username: username.replace('@', '')
    });
    
    setIsConnecting(false);
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (isConnected) {
      setIsConnected(false);
      onChange({ instagram_connected: false, instagram_username: value.replace('@', '') });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-[#E4405F] to-[#833AB4] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Instagram className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Conecte seu Instagram
        </h2>
        <p className="text-gray-600">
          Isso permite monitorar concorrentes e buscar referências automaticamente
        </p>
      </div>

      {isConnected ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <p className="font-semibold text-green-800 mb-1">Instagram conectado!</p>
          <p className="text-green-600 text-sm">@{username.replace('@', '')}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-4 text-green-700"
            onClick={() => {
              setIsConnected(false);
              onChange({ instagram_connected: false });
            }}
          >
            Desconectar
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instagram">Seu @ do Instagram</Label>
            <Input
              id="instagram"
              placeholder="@suaempresa"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
            />
          </div>

          <Button
            onClick={handleConnect}
            disabled={!username.trim() || isConnecting}
            className="w-full bg-gradient-to-r from-[#E4405F] to-[#833AB4] hover:opacity-90"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Conectando...
              </>
            ) : (
              <>
                <Instagram className="w-4 h-4 mr-2" />
                Conectar com Instagram
              </>
            )}
          </Button>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium">Conta Business necessária</p>
                <p className="text-xs text-amber-700 mt-1">
                  Para acessar métricas e insights, sua conta precisa ser Comercial ou Criador.
                </p>
                <a 
                  href="https://help.instagram.com/502981923235522" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-amber-800 font-medium flex items-center gap-1 mt-2 hover:underline"
                >
                  Como converter para conta comercial
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">
        Você pode pular esta etapa e conectar depois em Configurações
      </p>
    </div>
  );
}
