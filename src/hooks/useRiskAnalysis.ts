import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export const useRiskAnalysis = (description: string, dueDate?: Date) => {
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!description || !dueDate) {
        setRiskLevel(null);
        setAnalysis(null);
        return;
    }

    const analyzeRisk = async () => {
      setLoading(true);
      // Simulação de IA (substituir por chamada real à API da Val)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue < 2) {
        setRiskLevel('high');
        setAnalysis('Prazo muito curto para a complexidade estimada.');
      } else if (description.length < 20) {
        setRiskLevel('medium');
        setAnalysis('Descrição vaga pode levar a retrabalho.');
      } else {
        setRiskLevel('low');
        setAnalysis('Prazo adequado e escopo claro.');
      }
      setLoading(false);
    };

    const debounce = setTimeout(analyzeRisk, 1000);
    return () => clearTimeout(debounce);
  }, [description, dueDate]);

  return { riskLevel, analysis, loading };
};












