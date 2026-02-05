import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: LucideIcon;
  color: string; // Tailwind color class (e.g., 'text-blue-500')
  bgColor: string; // Tailwind bg class (e.g., 'bg-blue-50')
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  color, 
  bgColor 
}) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-all"
    >
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        
        {trend && (
          <div className={`flex items-center mt-2 text-xs font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <span className={`px-1.5 py-0.5 rounded-md ${
              trend.isPositive ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="ml-2 text-gray-400">vs mês anterior</span>
          </div>
        )}
      </div>
      
      <div className={`p-3 rounded-xl ${bgColor} ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
    </motion.div>
  );
};












