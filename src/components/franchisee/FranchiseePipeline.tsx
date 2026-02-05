'use client';

/**
 * Valle 360 - Franchisee Pipeline Component
 * Pipeline visual de candidatos a franqueado
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Search,
  ClipboardCheck,
  FileText,
  CheckCircle,
  XCircle,
  ArrowRight,
  Plus,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  Sparkles,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  capital_available?: number;
  stage: string;
  stage_changed_at: string;
  ai_fit_score?: number;
  ai_recommendation?: string;
  screening_score?: number;
  interview_score?: number;
}

interface PipelineStage {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

const stages: PipelineStage[] = [
  { id: 'new', label: 'Novos', icon: User, color: 'bg-gray-100 text-gray-600' },
  { id: 'screening', label: 'Triagem', icon: Search, color: 'bg-blue-100 text-blue-600' },
  { id: 'interview', label: 'Entrevista', icon: ClipboardCheck, color: 'bg-purple-100 text-purple-600' },
  { id: 'tests', label: 'Testes', icon: FileText, color: 'bg-amber-100 text-primary' },
  { id: 'analysis', label: 'Análise', icon: Sparkles, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'approved', label: 'Aprovados', icon: CheckCircle, color: 'bg-green-100 text-green-600' },
  { id: 'rejected', label: 'Reprovados', icon: XCircle, color: 'bg-red-100 text-red-600' }
];

interface FranchiseePipelineProps {
  candidates: Candidate[];
  onCandidateClick?: (candidate: Candidate) => void;
  onStageChange?: (candidateId: string, newStage: string) => void;
  onAddCandidate?: () => void;
}

export function FranchiseePipeline({
  candidates,
  onCandidateClick,
  onStageChange,
  onAddCandidate
}: FranchiseePipelineProps) {
  const [draggedCandidate, setDraggedCandidate] = useState<string | null>(null);

  const getCandidatesByStage = (stageId: string) => {
    return candidates.filter(c => c.stage === stageId);
  };

  const handleDragStart = (candidateId: string) => {
    setDraggedCandidate(candidateId);
  };

  const handleDragEnd = () => {
    setDraggedCandidate(null);
  };

  const handleDrop = (stageId: string) => {
    if (draggedCandidate && onStageChange) {
      onStageChange(draggedCandidate, stageId);
    }
    setDraggedCandidate(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Pipeline de Candidatos
          </h3>
          <p className="text-sm text-gray-500">
            {candidates.length} candidato{candidates.length !== 1 ? 's' : ''} no pipeline
          </p>
        </div>
        
        {onAddCandidate && (
          <button
            onClick={onAddCandidate}
            className="flex items-center gap-2 px-4 py-2 bg-[#1672d6] text-white rounded-xl text-sm font-medium hover:bg-[#1260b5] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Candidato
          </button>
        )}
      </div>

      {/* Pipeline Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.filter(s => s.id !== 'rejected').map(stage => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-72"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(stage.id)}
          >
            {/* Stage Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stage.color)}>
                  <stage.icon className="w-4 h-4" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {stage.label}
                </span>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400">
                  {getCandidatesByStage(stage.id).length}
                </span>
              </div>
            </div>

            {/* Stage Cards */}
            <div className="space-y-3 min-h-[200px] bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              <AnimatePresence>
                {getCandidatesByStage(stage.id).map(candidate => (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    draggable
                    onDragStart={() => handleDragStart(candidate.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onCandidateClick?.(candidate)}
                    className={cn(
                      "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-all",
                      draggedCandidate === candidate.id && "opacity-50"
                    )}
                  >
                    {/* Candidate Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-bold">
                          {candidate.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-white">
                            {candidate.name}
                          </h4>
                          {candidate.city && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {candidate.city}, {candidate.state}
                            </p>
                          )}
                        </div>
                      </div>
                      <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                    </div>

                    {/* Info */}
                    <div className="space-y-2 mb-3">
                      {candidate.capital_available && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <DollarSign className="w-3 h-3" />
                          Capital: {formatCurrency(candidate.capital_available)}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(candidate.stage_changed_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    {/* AI Score */}
                    {candidate.ai_fit_score && (
                      <div className={cn(
                        "flex items-center justify-between p-2 rounded-lg",
                        candidate.ai_fit_score >= 80 ? "bg-green-50" :
                        candidate.ai_fit_score >= 60 ? "bg-yellow-50" :
                        "bg-red-50"
                      )}>
                        <div className="flex items-center gap-1">
                          <Sparkles className={cn(
                            "w-3 h-3",
                            candidate.ai_fit_score >= 80 ? "text-green-500" :
                            candidate.ai_fit_score >= 60 ? "text-yellow-500" :
                            "text-red-500"
                          )} />
                          <span className="text-xs text-gray-600">Fit Score</span>
                        </div>
                        <span className={cn(
                          "text-sm font-bold",
                          candidate.ai_fit_score >= 80 ? "text-green-600" :
                          candidate.ai_fit_score >= 60 ? "text-yellow-600" :
                          "text-red-600"
                        )}>
                          {candidate.ai_fit_score}%
                        </span>
                      </div>
                    )}

                    {/* Scores */}
                    {(candidate.screening_score || candidate.interview_score) && (
                      <div className="flex gap-2 mt-2">
                        {candidate.screening_score && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            Triagem: {candidate.screening_score}
                          </span>
                        )}
                        {candidate.interview_score && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                            Entrevista: {candidate.interview_score}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {getCandidatesByStage(stage.id).length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <stage.icon className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Nenhum candidato</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Rejeitados (separado) */}
      {getCandidatesByStage('rejected').length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="w-3 h-3 text-red-600" />
            </div>
            <span className="font-medium text-gray-500">
              Reprovados ({getCandidatesByStage('rejected').length})
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {getCandidatesByStage('rejected').map(candidate => (
              <div
                key={candidate.id}
                onClick={() => onCandidateClick?.(candidate)}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <p className="font-medium text-gray-600 dark:text-gray-400 text-sm">
                  {candidate.name}
                </p>
                <p className="text-xs text-gray-400">
                  {candidate.city}, {candidate.state}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FranchiseePipeline;

