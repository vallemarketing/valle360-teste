'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  X,
  CreditCard,
  Smartphone,
  CheckCircle,
  Copy,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface PaymentCheckoutModalProps {
  invoice: {
    id: number;
    number: string;
    amount: number;
    dueDate: string;
    status?: string;
    paidDate?: string | null;
  };
  onClose: () => void;
}

export function PaymentCheckoutModal({ invoice, onClose }: PaymentCheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Simular código PIX
  const pixCode = `00020126360014BR.GOV.BCB.PIX0114+55119876543215204000053039865802BR5913Valle 3606009SAO PAULO62410503***50300017BR.GOV.BCB.BRCODE01051.0.06304`;
  const [pixCopied, setPixCopied] = useState(false);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const handleCardPayment = async () => {
    setProcessing(true);
    // TODO: Integrar com gateway de pagamento real
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-valle-silver-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-valle-navy-900 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-valle-blue-600" />
              Checkout de Pagamento
            </CardTitle>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-valle-silver-100 transition-colors"
            >
              <X className="w-5 h-5 text-valle-silver-600" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!success ? (
            <div className="space-y-6">
              {/* Invoice Summary */}
              <Card className="border-2 border-valle-blue-200 bg-gradient-to-r from-valle-blue-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-valle-silver-600">Fatura</span>
                    <Badge variant="outline">{invoice.number}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-valle-navy-900">
                      R$ {invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm text-valle-silver-600">
                      Venc: {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Selection */}
              {!paymentMethod && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-valle-navy-900">
                    Selecione o Método de Pagamento
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentMethod('pix')}
                      className="p-6 rounded-xl border-2 border-valle-silver-200 hover:border-valle-blue-600 hover:bg-valle-blue-50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
                          <Smartphone className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-valle-navy-900 text-lg">PIX</h4>
                          <p className="text-sm text-valle-silver-600">Instantâneo</p>
                        </div>
                      </div>
                      <p className="text-xs text-valle-silver-600">
                        Pagamento aprovado na hora via QR Code ou Copia e Cola
                      </p>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('card')}
                      className="p-6 rounded-xl border-2 border-valle-silver-200 hover:border-valle-blue-600 hover:bg-valle-blue-50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-valle-blue-500 to-valle-blue-700 rounded-xl flex items-center justify-center">
                          <CreditCard className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-valle-navy-900 text-lg">
                            Cartão de Crédito
                          </h4>
                          <p className="text-sm text-valle-silver-600">Parcelado</p>
                        </div>
                      </div>
                      <p className="text-xs text-valle-silver-600">
                        Parcele em até 12x sem juros no cartão de crédito
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* PIX Payment */}
              {paymentMethod === 'pix' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-valle-navy-900">
                      Pagamento via PIX
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentMethod(null)}
                    >
                      Voltar
                    </Button>
                  </div>

                  <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-white">
                    <CardContent className="p-6 space-y-4">
                      {/* QR Code Placeholder */}
                      <div className="bg-white p-6 rounded-xl border-2 border-green-300 flex flex-col items-center">
                        <div className="w-48 h-48 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-4">
                          <Smartphone className="w-24 h-24 text-green-700" />
                        </div>
                        <p className="text-sm text-center text-valle-silver-600 mb-2">
                          Escaneie o QR Code com o aplicativo do seu banco
                        </p>
                        <Badge className="bg-green-600 text-white">
                          PIX Copia e Cola disponível abaixo
                        </Badge>
                      </div>

                      {/* PIX Code */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-valle-navy-700">
                          Código PIX (Copia e Cola)
                        </label>
                        <div className="flex gap-2">
                          <Input
                            value={pixCode}
                            readOnly
                            className="flex-1 font-mono text-xs"
                          />
                          <Button
                            onClick={handleCopyPix}
                            className={pixCopied ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            {pixCopied ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Timer */}
                      <Card className="border border-amber-200 bg-amber-50">
                        <CardContent className="p-4 flex items-center gap-3">
                          <Clock className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm font-semibold text-amber-800">
                              Este PIX expira em 30 minutos
                            </p>
                            <p className="text-xs text-amber-700">
                              Após o pagamento, a confirmação é automática
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Card Payment */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-valle-navy-900">
                      Dados do Cartão
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentMethod(null)}
                    >
                      Voltar
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-valle-navy-700">
                        Número do Cartão
                      </label>
                      <Input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        className="h-12 text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-valle-navy-700">
                        Nome no Cartão
                      </label>
                      <Input
                        type="text"
                        placeholder="NOME COMO ESTÁ NO CARTÃO"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        className="h-12"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-valle-navy-700">
                          Validade
                        </label>
                        <Input
                          type="text"
                          placeholder="MM/AA"
                          value={cardExpiry}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            setCardExpiry(value);
                          }}
                          maxLength={5}
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-valle-navy-700">CVV</label>
                        <Input
                          type="text"
                          placeholder="000"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          maxLength={4}
                          className="h-12"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleCardPayment}
                      disabled={
                        processing ||
                        !cardNumber ||
                        !cardName ||
                        !cardExpiry ||
                        !cardCvv
                      }
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold"
                    >
                      {processing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          Pagar R$ {invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <h3 className="text-2xl font-bold text-valle-navy-900 mb-2">
                Pagamento Confirmado!
              </h3>
              <p className="text-valle-silver-600 mb-6">
                Sua fatura foi paga com sucesso
              </p>

              <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-white max-w-md mx-auto mb-6">
                <CardContent className="p-6 space-y-2">
                  <p className="text-sm text-valle-silver-600">
                    <strong>Fatura:</strong> {invoice.number}
                  </p>
                  <p className="text-sm text-valle-silver-600">
                    <strong>Valor:</strong> R$ {invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-valle-silver-600">
                    <strong>Método:</strong> {paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                  </p>
                  <p className="text-sm text-valle-silver-600">
                    <strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </CardContent>
              </Card>

              <p className="text-sm text-valle-silver-600 mb-6">
                O recibo foi enviado para seu email
              </p>

              <Button
                onClick={onClose}
                className="bg-valle-blue-600 hover:bg-valle-blue-700"
              >
                Fechar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
