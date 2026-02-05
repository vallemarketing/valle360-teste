'use client';

/**
 * Valle 360 - Catálogo de Recompensas
 * Página onde o cliente pode trocar pontos por recompensas
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, Star, Trophy, Crown, Zap, Check, X, Loader2,
  ArrowLeft, ShoppingBag, Sparkles, Clock, Tag
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getLevelInfo } from '@/lib/gamification/levels';

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  category: string;
  image_url?: string;
  stock: number;
  is_limited: boolean;
  expires_at?: string;
  tier_required?: string;
}

interface UserPoints {
  total_points: number;
  available_points: number;
  level: string;
}

const MOCK_REWARDS: Reward[] = [
  {
    id: '1',
    name: 'Consultoria de Marca (1h)',
    description: 'Uma hora de consultoria exclusiva para alinhamento estratégico da sua marca.',
    points_cost: 500,
    category: 'consultoria',
    stock: 10,
    is_limited: false,
  },
  {
    id: '2',
    name: 'Desconto 10% no Próximo Mês',
    description: 'Cupom de 10% de desconto na próxima fatura mensal.',
    points_cost: 300,
    category: 'desconto',
    stock: 50,
    is_limited: false,
  },
  {
    id: '3',
    name: 'Post Extra no Instagram',
    description: 'Um post adicional no Instagram, fora do pacote contratado.',
    points_cost: 150,
    category: 'servico',
    stock: 20,
    is_limited: false,
  },
  {
    id: '4',
    name: 'Stories Destacados',
    description: 'Criação de 5 stories destacados para seu perfil.',
    points_cost: 200,
    category: 'servico',
    stock: 15,
    is_limited: false,
  },
  {
    id: '5',
    name: 'Análise de Concorrentes',
    description: 'Relatório detalhado analisando 3 concorrentes do seu setor.',
    points_cost: 400,
    category: 'consultoria',
    stock: 5,
    is_limited: true,
    expires_at: '2026-02-28',
  },
  {
    id: '6',
    name: 'Vídeo Institucional (30s)',
    description: 'Produção de um vídeo institucional curto para suas redes.',
    points_cost: 800,
    category: 'producao',
    stock: 3,
    is_limited: true,
    tier_required: 'gold',
  },
  {
    id: '7',
    name: 'Prioridade no Atendimento',
    description: 'Atendimento prioritário por 30 dias.',
    points_cost: 250,
    category: 'beneficio',
    stock: 100,
    is_limited: false,
  },
  {
    id: '8',
    name: 'Kit Valle Exclusivo',
    description: 'Kit com camiseta, caneca e adesivos Valle.',
    points_cost: 600,
    category: 'brinde',
    stock: 10,
    is_limited: true,
    tier_required: 'silver',
  },
];

const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: Gift },
  { id: 'servico', name: 'Serviços', icon: Zap },
  { id: 'desconto', name: 'Descontos', icon: Tag },
  { id: 'consultoria', name: 'Consultoria', icon: Star },
  { id: 'producao', name: 'Produção', icon: Sparkles },
  { id: 'brinde', name: 'Brindes', icon: ShoppingBag },
  { id: 'beneficio', name: 'Benefícios', icon: Crown },
];

export default function RewardsRedemptionPage() {
  const [rewards, setRewards] = useState<Reward[]>(MOCK_REWARDS);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<Reward | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Buscar pontos do usuário
      const pointsRes = await fetch('/api/client/points');
      const pointsData = await pointsRes.json();
      
      if (pointsData.success) {
        setUserPoints({
          total_points: pointsData.total_points || 0,
          available_points: pointsData.available_points || pointsData.total_points || 0,
          level: pointsData.level || 'bronze',
        });
      }

      // Buscar recompensas disponíveis
      const rewardsRes = await fetch('/api/client/rewards');
      const rewardsData = await rewardsRes.json();
      
      if (rewardsData.success && rewardsData.rewards) {
        setRewards(rewardsData.rewards);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (!userPoints || userPoints.available_points < reward.points_cost) {
      toast.error('Pontos insuficientes');
      return;
    }

    setRedeeming(reward.id);
    try {
      const response = await fetch('/api/client/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId: reward.id }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Recompensa resgatada com sucesso!', {
          description: 'Você receberá instruções por email.',
        });
        setShowConfirmModal(null);
        loadData();
      } else {
        toast.error(data.error || 'Erro ao resgatar recompensa');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao resgatar recompensa');
    } finally {
      setRedeeming(null);
    }
  };

  const filteredRewards = rewards.filter(r => 
    selectedCategory === 'all' || r.category === selectedCategory
  );

  const canRedeem = (reward: Reward) => {
    if (!userPoints) return false;
    if (userPoints.available_points < reward.points_cost) return false;
    if (reward.stock <= 0) return false;
    // Verificar tier se necessário
    if (reward.tier_required) {
      const levelInfo = getLevelInfo(userPoints.total_points);
      const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      const userTierIndex = tierOrder.indexOf(levelInfo.currentLevel.id);
      const requiredTierIndex = tierOrder.indexOf(reward.tier_required);
      if (userTierIndex < requiredTierIndex) return false;
    }
    return true;
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.id === category);
    return cat?.icon || Gift;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/cliente/programa-fidelidade">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Catálogo de Recompensas
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Troque seus pontos por benefícios exclusivos
              </p>
            </div>
          </div>

          {/* Pontos Disponíveis */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-3 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Seus pontos</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {userPoints?.available_points?.toLocaleString('pt-BR') || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Categorias */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all",
                selectedCategory === cat.id
                  ? "bg-primary text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <cat.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Grid de Recompensas */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRewards.map((reward, index) => {
            const CategoryIcon = getCategoryIcon(reward.category);
            const canRedeemThis = canRedeem(reward);

            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "overflow-hidden h-full flex flex-col transition-all",
                  canRedeemThis ? "hover:shadow-lg" : "opacity-60"
                )}>
                  {/* Imagem ou Ícone */}
                  <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative">
                    <CategoryIcon className="w-12 h-12 text-primary/50" />
                    
                    {/* Badges */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {reward.is_limited && (
                        <Badge variant="danger" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Limitado
                        </Badge>
                      )}
                      {reward.tier_required && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          <Crown className="w-3 h-3 mr-1" />
                          {reward.tier_required}+
                        </Badge>
                      )}
                    </div>

                    {/* Estoque */}
                    {reward.stock < 10 && reward.stock > 0 && (
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="outline" className="text-xs bg-white/80">
                          Restam {reward.stock}
                        </Badge>
                      </div>
                    )}
                    {reward.stock === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold">ESGOTADO</span>
                      </div>
                    )}
                  </div>

                  <CardContent className="flex-1 flex flex-col p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {reward.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">
                      {reward.description}
                    </p>

                    {/* Preço e Botão */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-primary font-bold">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{reward.points_cost.toLocaleString('pt-BR')}</span>
                      </div>

                      <Button
                        size="sm"
                        disabled={!canRedeemThis || redeeming === reward.id}
                        onClick={() => setShowConfirmModal(reward)}
                        className={cn(
                          canRedeemThis
                            ? "bg-primary hover:bg-primary/90"
                            : "bg-gray-300 cursor-not-allowed"
                        )}
                      >
                        {redeeming === reward.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Resgatar'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredRewards.length === 0 && (
          <div className="text-center py-12">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma recompensa encontrada nesta categoria</p>
          </div>
        )}

        {/* Modal de Confirmação */}
        <AnimatePresence>
          {showConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowConfirmModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                    <Gift className="w-8 h-8 text-primary" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Confirmar Resgate
                  </h3>

                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Deseja resgatar <strong>{showConfirmModal.name}</strong> por{' '}
                    <strong className="text-primary">
                      {showConfirmModal.points_cost.toLocaleString('pt-BR')} pontos
                    </strong>?
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Seus pontos atuais:</span>
                      <span className="font-medium">{userPoints?.available_points?.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Custo:</span>
                      <span className="font-medium text-red-500">-{showConfirmModal.points_cost.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-sm">
                      <span className="text-gray-500">Após resgate:</span>
                      <span className="font-bold text-primary">
                        {((userPoints?.available_points || 0) - showConfirmModal.points_cost).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowConfirmModal(null)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => handleRedeem(showConfirmModal)}
                      disabled={redeeming === showConfirmModal.id}
                    >
                      {redeeming === showConfirmModal.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Resgatando...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Confirmar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
