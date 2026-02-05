'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, User, Target, Heart, Shield, Zap,
  ChevronRight, Check, BarChart3, Award
} from 'lucide-react';

interface TestQuestion {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
    value: Record<string, number>;
  }[];
}

interface TestResult {
  category: string;
  score: number;
  maxScore: number;
  description: string;
  color: string;
}

interface BehavioralTestsProps {
  testType: 'disc' | 'bigfive' | 'fit' | 'technical';
  onComplete?: (results: TestResult[]) => void;
}

// DISC Test Questions - 10 perguntas para análise completa
const DISC_QUESTIONS: TestQuestion[] = [
  {
    id: '1',
    text: 'Em um projeto em grupo, você geralmente:',
    options: [
      { id: 'a', text: 'Assume a liderança e toma decisões rápidas', value: { D: 3, I: 1, S: 0, C: 0 } },
      { id: 'b', text: 'Motiva e inspira os outros membros', value: { D: 1, I: 3, S: 1, C: 0 } },
      { id: 'c', text: 'Apoia o grupo e mantém a harmonia', value: { D: 0, I: 1, S: 3, C: 1 } },
      { id: 'd', text: 'Analisa os detalhes e garante qualidade', value: { D: 0, I: 0, S: 1, C: 3 } }
    ]
  },
  {
    id: '2',
    text: 'Quando enfrenta um problema complexo, você:',
    options: [
      { id: 'a', text: 'Age rapidamente para resolver', value: { D: 3, I: 1, S: 0, C: 0 } },
      { id: 'b', text: 'Discute com outros para encontrar soluções criativas', value: { D: 1, I: 3, S: 1, C: 0 } },
      { id: 'c', text: 'Busca uma solução que agrade a todos', value: { D: 0, I: 1, S: 3, C: 1 } },
      { id: 'd', text: 'Analisa todas as opções antes de decidir', value: { D: 0, I: 0, S: 1, C: 3 } }
    ]
  },
  {
    id: '3',
    text: 'Em reuniões, você costuma:',
    options: [
      { id: 'a', text: 'Ir direto ao ponto e focar em resultados', value: { D: 3, I: 1, S: 0, C: 0 } },
      { id: 'b', text: 'Participar ativamente e trazer energia', value: { D: 1, I: 3, S: 1, C: 0 } },
      { id: 'c', text: 'Ouvir e contribuir quando solicitado', value: { D: 0, I: 1, S: 3, C: 1 } },
      { id: 'd', text: 'Fazer perguntas detalhadas e tomar notas', value: { D: 0, I: 0, S: 1, C: 3 } }
    ]
  },
  {
    id: '4',
    text: 'Você se sente mais confortável quando:',
    options: [
      { id: 'a', text: 'Tem controle sobre as situações', value: { D: 3, I: 1, S: 0, C: 0 } },
      { id: 'b', text: 'Está cercado de pessoas', value: { D: 1, I: 3, S: 1, C: 0 } },
      { id: 'c', text: 'O ambiente é estável e previsível', value: { D: 0, I: 1, S: 3, C: 1 } },
      { id: 'd', text: 'Tem tempo para planejar e organizar', value: { D: 0, I: 0, S: 1, C: 3 } }
    ]
  },
  {
    id: '5',
    text: 'Sob pressão, você tende a:',
    options: [
      { id: 'a', text: 'Ficar mais assertivo e direto', value: { D: 3, I: 1, S: 0, C: 0 } },
      { id: 'b', text: 'Buscar apoio e conversar com outros', value: { D: 1, I: 3, S: 1, C: 0 } },
      { id: 'c', text: 'Manter a calma e evitar conflitos', value: { D: 0, I: 1, S: 3, C: 1 } },
      { id: 'd', text: 'Focar nos detalhes e procedimentos', value: { D: 0, I: 0, S: 1, C: 3 } }
    ]
  },
  {
    id: '6',
    text: 'Quando recebe feedback negativo, você:',
    options: [
      { id: 'a', text: 'Questiona e busca entender os fatos', value: { D: 3, I: 1, S: 0, C: 0 } },
      { id: 'b', text: 'Se sente afetado emocionalmente mas supera rápido', value: { D: 1, I: 3, S: 1, C: 0 } },
      { id: 'c', text: 'Aceita com calma e reflete sobre o que pode melhorar', value: { D: 0, I: 1, S: 3, C: 1 } },
      { id: 'd', text: 'Analisa detalhadamente se o feedback é válido', value: { D: 0, I: 0, S: 1, C: 3 } }
    ]
  },
  {
    id: '7',
    text: 'Ao iniciar um novo projeto, você prefere:',
    options: [
      { id: 'a', text: 'Definir metas ambiciosas e partir para ação', value: { D: 3, I: 1, S: 0, C: 0 } },
      { id: 'b', text: 'Reunir a equipe e fazer um brainstorm', value: { D: 1, I: 3, S: 1, C: 0 } },
      { id: 'c', text: 'Entender o processo e seguir passo a passo', value: { D: 0, I: 1, S: 3, C: 1 } },
      { id: 'd', text: 'Pesquisar referências e criar um planejamento detalhado', value: { D: 0, I: 0, S: 1, C: 3 } }
    ]
  },
  {
    id: '8',
    text: 'Em relação a mudanças no trabalho, você:',
    options: [
      { id: 'a', text: 'Abraça mudanças como oportunidades de crescimento', value: { D: 3, I: 1, S: 0, C: 0 } },
      { id: 'b', text: 'Se adapta bem se puder compartilhar a experiência com outros', value: { D: 1, I: 3, S: 1, C: 0 } },
      { id: 'c', text: 'Prefere tempo para se adaptar gradualmente', value: { D: 0, I: 1, S: 3, C: 1 } },
      { id: 'd', text: 'Precisa entender a lógica e os detalhes da mudança', value: { D: 0, I: 0, S: 1, C: 3 } }
    ]
  },
  {
    id: '9',
    text: 'Seu estilo de comunicação é mais:',
    options: [
      { id: 'a', text: 'Direto, objetivo e focado em resultados', value: { D: 3, I: 1, S: 0, C: 0 } },
      { id: 'b', text: 'Entusiasmado, expressivo e persuasivo', value: { D: 1, I: 3, S: 1, C: 0 } },
      { id: 'c', text: 'Calmo, empático e bom ouvinte', value: { D: 0, I: 1, S: 3, C: 1 } },
      { id: 'd', text: 'Preciso, lógico e baseado em fatos', value: { D: 0, I: 0, S: 1, C: 3 } }
    ]
  },
  {
    id: '10',
    text: 'O que mais te motiva no trabalho?',
    options: [
      { id: 'a', text: 'Desafios, autonomia e resultados', value: { D: 3, I: 1, S: 0, C: 0 } },
      { id: 'b', text: 'Reconhecimento, interação social e criatividade', value: { D: 1, I: 3, S: 1, C: 0 } },
      { id: 'c', text: 'Estabilidade, trabalho em equipe e ajudar outros', value: { D: 0, I: 1, S: 3, C: 1 } },
      { id: 'd', text: 'Precisão, qualidade e fazer o trabalho bem feito', value: { D: 0, I: 0, S: 1, C: 3 } }
    ]
  }
];

const DISC_DESCRIPTIONS: Record<string, { name: string; description: string; color: string; icon: React.ReactNode }> = {
  D: { 
    name: 'Dominância', 
    description: 'Focado em resultados, decisivo, competitivo', 
    color: '#EF4444',
    icon: <Target className="w-5 h-5" />
  },
  I: { 
    name: 'Influência', 
    description: 'Entusiasta, otimista, colaborativo', 
    color: '#F59E0B',
    icon: <Heart className="w-5 h-5" />
  },
  S: { 
    name: 'Estabilidade', 
    description: 'Paciente, confiável, trabalha em equipe', 
    color: '#10B981',
    icon: <Shield className="w-5 h-5" />
  },
  C: { 
    name: 'Conformidade', 
    description: 'Analítico, preciso, focado em qualidade', 
    color: '#3B82F6',
    icon: <BarChart3 className="w-5 h-5" />
  }
};

export function BehavioralTests({ testType, onComplete }: BehavioralTestsProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const questions = testType === 'disc' ? DISC_QUESTIONS : DISC_QUESTIONS; // TODO: Add other test types

  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      calculateResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateResults = () => {
    const scores: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
    const maxScores: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };

    questions.forEach(question => {
      const selectedOption = question.options.find(o => o.id === answers[question.id]);
      if (selectedOption) {
        Object.entries(selectedOption.value).forEach(([key, value]) => {
          scores[key] += value;
        });
      }
      // Calculate max possible score
      question.options.forEach(option => {
        Object.entries(option.value).forEach(([key, value]) => {
          if (value > (maxScores[key] / questions.length)) {
            maxScores[key] = Math.max(maxScores[key], value * questions.length);
          }
        });
      });
    });

    // Normalize max scores
    Object.keys(maxScores).forEach(key => {
      maxScores[key] = questions.length * 3; // Max 3 points per question
    });

    const calculatedResults: TestResult[] = Object.entries(scores).map(([key, score]) => ({
      category: DISC_DESCRIPTIONS[key].name,
      score,
      maxScore: maxScores[key],
      description: DISC_DESCRIPTIONS[key].description,
      color: DISC_DESCRIPTIONS[key].color
    }));

    setResults(calculatedResults);
    setShowResults(true);
    onComplete?.(calculatedResults);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];
  const selectedAnswer = answers[currentQ.id];

  if (showResults) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 border"
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-light)'
        }}
      >
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'var(--success-100)' }}
          >
            <Award className="w-8 h-8" style={{ color: 'var(--success-500)' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Teste Concluído!
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Confira seu perfil comportamental abaixo
          </p>
        </div>

        {/* Results Chart */}
        <div className="space-y-4 mb-8">
          {results.map((result, index) => (
            <motion.div
              key={result.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {result.category}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {Math.round((result.score / result.maxScore) * 100)}%
                </span>
              </div>
              <div 
                className="h-4 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(result.score / result.maxScore) * 100}%` }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: result.color }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {result.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Dominant Profile */}
        {results.length > 0 && (
          <div 
            className="p-4 rounded-xl"
            style={{ 
              backgroundColor: `${results.sort((a, b) => b.score - a.score)[0].color}10`,
              border: `1px solid ${results.sort((a, b) => b.score - a.score)[0].color}30`
            }}
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Perfil Dominante: {results.sort((a, b) => b.score - a.score)[0].category}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {results.sort((a, b) => b.score - a.score)[0].description}
            </p>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Pergunta {currentQuestion + 1} de {questions.length}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div 
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full rounded-full"
            style={{ backgroundColor: 'var(--primary-500)' }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="rounded-2xl p-6 border"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-light)'
          }}
        >
          <h3 
            className="text-lg font-semibold mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            {currentQ.text}
          </h3>

          <div className="space-y-3">
            {currentQ.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(currentQ.id, option.id)}
                className="w-full p-4 rounded-xl text-left transition-all border"
                style={{
                  backgroundColor: selectedAnswer === option.id 
                    ? 'var(--primary-100)' 
                    : 'var(--bg-secondary)',
                  borderColor: selectedAnswer === option.id 
                    ? 'var(--primary-500)' 
                    : 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center border-2"
                    style={{
                      borderColor: selectedAnswer === option.id 
                        ? 'var(--primary-500)' 
                        : 'var(--border-medium)',
                      backgroundColor: selectedAnswer === option.id 
                        ? 'var(--primary-500)' 
                        : 'transparent'
                    }}
                  >
                    {selectedAnswer === option.id && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span>{option.text}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-light)'
          }}
        >
          Anterior
        </button>

        <button
          onClick={handleNext}
          disabled={!selectedAnswer}
          className="px-6 py-2 rounded-xl font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-2"
          style={{ backgroundColor: 'var(--primary-500)' }}
        >
          {currentQuestion === questions.length - 1 ? 'Finalizar' : 'Próxima'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default BehavioralTests;









