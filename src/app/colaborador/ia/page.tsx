import { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Sparkles, TrendingUp, Lightbulb, BookOpen, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'IA - Colaborador | Valle 360',
};

const suggestions = [
  {
    icon: TrendingUp,
    title: 'Tendência: Reels curtos em alta',
    description: 'Conteúdos de 7-15 segundos estão gerando 40% mais engajamento',
    link: 'https://example.com',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Lightbulb,
    title: 'Estratégia: Teste A/B de criativos',
    description: 'Implemente testes com variações de copy para melhorar CTR',
    link: 'https://example.com',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: BookOpen,
    title: 'Curso: Meta Ads avançado',
    description: 'Aprenda técnicas de otimização de campanhas de performance',
    link: 'https://example.com',
    color: 'from-emerald-500 to-teal-500',
  },
];

export default function EmployeeIAPage() {
  return (
    <div className="p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-foreground">Assistente IA</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Sugestões e atalhos para a Val (IA) por área
          </p>
        </div>

        <Card className="p-5 mb-6 border border-border bg-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">Abrir a Val (IA)</p>
              <p className="text-sm text-muted-foreground">Chat completo com contexto do seu perfil e da sua área.</p>
            </div>
            <Link
              href="/colaborador/val"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1672d6] text-white hover:bg-[#1260b5] transition-colors"
            >
              Ir para Val <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>

        <div className="space-y-4">
          {suggestions.map((suggestion, i) => {
            const Icon = suggestion.icon;
            return (
              <Card key={i} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`p-3 bg-gradient-to-br ${suggestion.color} rounded-xl`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {suggestion.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {suggestion.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        Ver detalhes →
                      </button>
                      <button className="text-sm text-muted-foreground hover:text-foreground">
                        Útil 👍
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-2">
            💡 Dica do dia
          </h3>
          <p className="text-sm text-gray-700">
            Clientes que visualizam o dashboard regularmente têm 30% mais satisfação.
            Compartilhe insights semanais!
          </p>
        </Card>
      </div>
    </div>
  );
}
