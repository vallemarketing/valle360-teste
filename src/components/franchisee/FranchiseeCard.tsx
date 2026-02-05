'use client';

/**
 * Valle 360 - Franchisee Card Component
 * Card com métricas e status do franqueado
 */

import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Users,
  BarChart3,
  Star,
  Phone,
  Mail,
  MoreVertical,
  Eye,
  Edit,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Franchisee {
  id: string;
  unit_name: string;
  unit_code?: string;
  city?: string;
  state?: string;
  owner_name: string;
  owner_email?: string;
  owner_phone?: string;
  status: 'candidate' | 'active' | 'inactive' | 'suspended';
  health_status?: 'healthy' | 'attention' | 'critical';
  performance_score?: number;
  current_nps?: number;
  churn_risk?: number;
  ranking_position?: number;
  ranking_total?: number;
  followers_total?: number;
  engagement_rate?: number;
  vs_network_average?: number;
}

interface FranchiseeCardProps {
  franchisee: Franchisee;
  onClick?: () => void;
  onEdit?: () => void;
  onMessage?: () => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export function FranchiseeCard({
  franchisee,
  onClick,
  onEdit,
  onMessage,
  showActions = true,
  variant = 'default'
}: FranchiseeCardProps) {
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500 bg-green-100';
      case 'attention': return 'text-yellow-500 bg-yellow-100';
      case 'critical': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return { label: 'Ativa', color: 'bg-green-100 text-green-700' };
      case 'inactive': return { label: 'Inativa', color: 'bg-gray-100 text-gray-700' };
      case 'suspended': return { label: 'Suspensa', color: 'bg-red-100 text-red-700' };
      case 'candidate': return { label: 'Candidato', color: 'bg-blue-100 text-blue-700' };
      default: return { label: status, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const statusBadge = getStatusBadge(franchisee.status);

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        onClick={onClick}
        className={cn(
          "flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700",
          onClick && "cursor-pointer hover:shadow-md transition-shadow"
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-bold">
          {franchisee.unit_name.substring(0, 2).toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-800 dark:text-white truncate">
            {franchisee.unit_name}
          </h4>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {franchisee.city}, {franchisee.state}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {franchisee.performance_score && (
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800 dark:text-white">
                {franchisee.performance_score}
              </p>
              <p className="text-xs text-gray-500">Score</p>
            </div>
          )}
          
          {franchisee.health_status && (
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              getHealthColor(franchisee.health_status)
            )}>
              {franchisee.health_status === 'healthy' && <CheckCircle className="w-4 h-4" />}
              {franchisee.health_status === 'attention' && <AlertTriangle className="w-4 h-4" />}
              {franchisee.health_status === 'critical' && <AlertTriangle className="w-4 h-4" />}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden",
        onClick && "cursor-pointer hover:shadow-lg transition-all"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-bold text-lg">
              {franchisee.unit_code || franchisee.unit_name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white">
                {franchisee.unit_name}
              </h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {franchisee.city}, {franchisee.state}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              statusBadge.color
            )}>
              {statusBadge.label}
            </span>
            
            {showActions && (
              <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="p-4 grid grid-cols-3 gap-4">
        {/* Performance Score */}
        <div className="text-center">
          <div className={cn(
            "inline-flex items-center justify-center w-12 h-12 rounded-xl mb-2",
            franchisee.performance_score && franchisee.performance_score >= 80 ? "bg-green-100" :
            franchisee.performance_score && franchisee.performance_score >= 60 ? "bg-yellow-100" :
            "bg-red-100"
          )}>
            <span className={cn(
              "text-xl font-bold",
              franchisee.performance_score && franchisee.performance_score >= 80 ? "text-green-600" :
              franchisee.performance_score && franchisee.performance_score >= 60 ? "text-yellow-600" :
              "text-red-600"
            )}>
              {franchisee.performance_score || '-'}
            </span>
          </div>
          <p className="text-xs text-gray-500">Performance</p>
        </div>

        {/* NPS */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 mb-2">
            <span className="text-xl font-bold text-purple-600">
              {franchisee.current_nps || '-'}
            </span>
          </div>
          <p className="text-xs text-gray-500">NPS</p>
        </div>

        {/* Ranking */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 mb-2">
            <span className="text-xl font-bold text-blue-600">
              {franchisee.ranking_position ? `#${franchisee.ranking_position}` : '-'}
            </span>
          </div>
          <p className="text-xs text-gray-500">Ranking</p>
        </div>
      </div>

      {/* Comparativo */}
      {franchisee.vs_network_average !== undefined && (
        <div className="px-4 pb-4">
          <div className={cn(
            "flex items-center justify-between p-3 rounded-xl",
            franchisee.vs_network_average >= 0 ? "bg-green-50" : "bg-red-50"
          )}>
            <span className="text-sm text-gray-600">vs. Média da Rede</span>
            <div className={cn(
              "flex items-center gap-1 font-bold",
              franchisee.vs_network_average >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {franchisee.vs_network_average >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {franchisee.vs_network_average >= 0 ? '+' : ''}{franchisee.vs_network_average}%
            </div>
          </div>
        </div>
      )}

      {/* Responsável */}
      <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4">
        <p className="text-xs text-gray-400 mb-2">Responsável</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800 dark:text-white">
              {franchisee.owner_name}
            </p>
            <div className="flex items-center gap-3 mt-1">
              {franchisee.owner_phone && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {franchisee.owner_phone}
                </span>
              )}
            </div>
          </div>
          
          {showActions && (
            <div className="flex gap-1">
              {onMessage && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onMessage(); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                </button>
              )}
              {onEdit && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Health Status Bar */}
      {franchisee.health_status && (
        <div className={cn(
          "h-1",
          franchisee.health_status === 'healthy' && "bg-green-500",
          franchisee.health_status === 'attention' && "bg-yellow-500",
          franchisee.health_status === 'critical' && "bg-red-500"
        )} />
      )}
    </motion.div>
  );
}

export default FranchiseeCard;

