import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Relatórios</h1>
        <p className="text-foreground/70">Performance e métricas</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-sm text-foreground/70">
              Tarefas Concluídas (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-foreground">48</div>
              <div className="flex items-center gap-1 text-green-500">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+12%</span>
              </div>
            </div>
            <p className="text-xs text-foreground/60 mt-2">vs. mês anterior</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-sm text-foreground/70">
              Tempo Médio de Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-foreground">3.2d</div>
              <div className="flex items-center gap-1 text-green-500">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-medium">-8%</span>
              </div>
            </div>
            <p className="text-xs text-foreground/60 mt-2">Melhoria contínua</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-sm text-foreground/70">
              Taxa de Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-foreground">94%</div>
              <div className="flex items-center gap-1 text-green-500">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+3%</span>
              </div>
            </div>
            <p className="text-xs text-foreground/60 mt-2">Excelente resultado</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance por Colaborador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'João Silva', tasks: 12, rating: 4.8 },
              { name: 'Maria Santos', tasks: 10, rating: 4.9 },
              { name: 'Pedro Costa', tasks: 15, rating: 4.7 },
              { name: 'Ana Lima', tasks: 11, rating: 4.6 },
            ].map((person) => (
              <div
                key={person.name}
                className="flex items-center justify-between p-4 rounded-lg bg-valle-navy/30"
              >
                <div>
                  <p className="font-medium text-foreground">{person.name}</p>
                  <p className="text-sm text-foreground/60">{person.tasks} tarefas concluídas</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-valle-blue">{person.rating}</p>
                  <p className="text-xs text-foreground/60">Avaliação</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
