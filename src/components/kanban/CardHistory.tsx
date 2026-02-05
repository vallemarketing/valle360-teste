'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, Clock, User, Calendar, FileText, 
  CheckCircle2, AlertCircle, MessageSquare 
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

export interface HistoryEntry {
  id: string;
  type: 'phase_change' | 'field_update' | 'comment' | 'created';
  timestamp: Date;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  data: {
    fromPhase?: { id: string; title: string; color: string };
    toPhase?: { id: string; title: string; color: string };
    fieldsUpdated?: { field: string; oldValue?: any; newValue: any }[];
    comment?: string;
  };
}

interface CardHistoryProps {
  history: HistoryEntry[];
  compact?: boolean;
}

export default function CardHistory({ history, compact = false }: CardHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum histórico disponível</p>
      </div>
    );
  }

  const getIcon = (type: HistoryEntry['type']) => {
    switch (type) {
      case 'phase_change':
        return <ArrowRight className="w-4 h-4" />;
      case 'field_update':
        return <FileText className="w-4 h-4" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4" />;
      case 'created':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getIconBg = (type: HistoryEntry['type']) => {
    switch (type) {
      case 'phase_change':
        return 'bg-blue-100 text-blue-600';
      case 'field_update':
        return 'bg-purple-100 text-purple-600';
      case 'comment':
        return 'bg-green-100 text-green-600';
      case 'created':
        return 'bg-emerald-100 text-emerald-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const renderContent = (entry: HistoryEntry) => {
    switch (entry.type) {
      case 'phase_change':
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-600">moveu de</span>
            <span 
              className="px-2 py-0.5 rounded text-white text-xs font-medium"
              style={{ backgroundColor: entry.data.fromPhase?.color }}
            >
              {entry.data.fromPhase?.title}
            </span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span 
              className="px-2 py-0.5 rounded text-white text-xs font-medium"
              style={{ backgroundColor: entry.data.toPhase?.color }}
            >
              {entry.data.toPhase?.title}
            </span>
          </div>
        );

      case 'field_update':
        return (
          <div className="space-y-1">
            <span className="text-gray-600">atualizou campos:</span>
            {!compact && entry.data.fieldsUpdated?.map((field, idx) => (
              <div key={idx} className="text-xs bg-gray-50 px-2 py-1 rounded">
                <span className="font-medium">{field.field}:</span>{' '}
                {field.oldValue && (
                  <span className="text-gray-400 line-through mr-1">{String(field.oldValue)}</span>
                )}
                <span className="text-gray-700">{String(field.newValue)}</span>
              </div>
            ))}
          </div>
        );

      case 'comment':
        return (
          <div>
            <span className="text-gray-600">comentou:</span>
            {!compact && (
              <p className="text-sm bg-gray-50 px-3 py-2 rounded mt-1 text-gray-700">
                "{entry.data.comment}"
              </p>
            )}
          </div>
        );

      case 'created':
        return <span className="text-gray-600">criou este card</span>;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Histórico
      </h4>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-4">
          {history.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative pl-10"
            >
              {/* Icon */}
              <div 
                className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${getIconBg(entry.type)}`}
              >
                {getIcon(entry.type)}
              </div>

              {/* Content */}
              <div className={`bg-white rounded-lg border p-3 ${compact ? 'py-2' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  {entry.user.avatar ? (
                    <img 
                      src={entry.user.avatar} 
                      alt={entry.user.name}
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-500" />
                    </div>
                  )}
                  <span className="font-medium text-sm text-gray-900">{entry.user.name}</span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(entry.timestamp, { addSuffix: true, locale: ptBR })}
                  </span>
                </div>

                <div className="text-sm">
                  {renderContent(entry)}
                </div>

                {!compact && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {format(entry.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente compacto para exibir no card
export function CardHistoryPreview({ history }: { history: HistoryEntry[] }) {
  const lastEntry = history[0];
  
  if (!lastEntry) return null;

  return (
    <div className="text-xs text-gray-500 flex items-center gap-1 mt-2">
      <Clock className="w-3 h-3" />
      <span>
        Última atualização: {formatDistanceToNow(lastEntry.timestamp, { addSuffix: true, locale: ptBR })}
      </span>
    </div>
  );
}
