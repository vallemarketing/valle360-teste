import { KanbanColumn } from '@/types/kanban';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottleneckAlertProps {
  columns: KanbanColumn[];
}

export const BottleneckAlert: React.FC<BottleneckAlertProps> = ({ columns }) => {
  const bottlenecks = columns.filter(col => col.wipLimit && col.cards.length >= col.wipLimit);

  if (bottlenecks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"
    >
      <div className="bg-red-100 p-2 rounded-full">
        <AlertTriangle className="w-5 h-5 text-red-600" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-red-800">Gargalo Detectado!</h4>
        <p className="text-sm text-red-700">
          As seguintes fases atingiram o limite de capacidade: 
          <span className="font-bold ml-1">
            {bottlenecks.map(b => b.title).join(', ')}
          </span>
        </p>
      </div>
      <button className="px-4 py-2 bg-white border border-red-200 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
        Ver Detalhes
      </button>
    </motion.div>
  );
};












