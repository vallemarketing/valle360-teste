import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface GeneratedPasswordDisplayProps {
  password: string;
  email: string;
}

export function GeneratedPasswordDisplay({ password, email }: GeneratedPasswordDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar senha:', error);
    }
  };

  return (
    <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">⚠️</span>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900 mb-2">
            Senha Forte Gerada Automaticamente
          </h3>
          
          <p className="text-sm text-yellow-800 mb-3">
            A senha fornecida era muito fraca para o cPanel. Uma senha forte foi gerada automaticamente:
          </p>
          
          <div className="bg-white border border-yellow-300 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">Email:</span>
              <span className="text-sm font-mono">{email}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Senha:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold">
                  {visible ? password : '•'.repeat(password.length)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3">
            <p className="text-xs font-semibold text-yellow-900 mb-1">
              ⚠️ IMPORTANTE - Copie e salve esta senha!
            </p>
            <ul className="text-xs text-yellow-800 space-y-1">
              <li>• Esta senha <strong>não será mostrada novamente</strong></li>
              <li>• Envie para o colaborador por canal seguro (WhatsApp, email, etc.)</li>
              <li>• O colaborador poderá alterar a senha depois pelo webmail</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
