'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Users, Globe, Filter,
  Download, Calendar, Target, Award, BarChart3,
  PieChart, MapPin
} from 'lucide-react';
import { SalesKPICardsDark, PipelineKPIs } from '@/components/sales/SalesKPICards';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart as RechartsPie,
  Pie, Cell
} from 'recharts';

// Sample data for charts
const SALES_BY_YEAR = [
  { year: '2017', value: 20 },
  { year: '2018', value: 50 },
  { year: '2019', value: 80 },
  { year: '2020', value: 60 },
  { year: '2021', value: 100 },
  { year: '2022', value: 120 },
  { year: '2023', value: 150 },
  { year: '2024', value: 171 }
];

const SALES_BY_BRAND = [
  { name: 'Marca A', value: 45000000, color: '#8B5CF6' },
  { name: 'Marca B', value: 38000000, color: '#6366F1' },
  { name: 'Marca C', value: 32000000, color: '#3B82F6' },
  { name: 'Marca D', value: 28000000, color: '#0EA5E9' },
  { name: 'Marca E', value: 18000000, color: '#06B6D4' },
  { name: 'Outros', value: 10000000, color: '#6B7280' }
];

const SALES_BY_CONTINENT = [
  { name: 'América do Sul', value: 65, color: '#8B5CF6' },
  { name: 'América do Norte', value: 20, color: '#3B82F6' },
  { name: 'Europa', value: 10, color: '#10B981' },
  { name: 'Ásia', value: 5, color: '#F59E0B' }
];

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(0)} Mi`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  }
  return `R$ ${value}`;
};

export default function ComercialPage() {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('all');

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#0F172A' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' }}
            >
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard Comercial</h1>
              <p className="text-gray-400">Análise de Vendas e Performance</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ 
                backgroundColor: '#1E293B',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ 
                backgroundColor: '#1E293B',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <option value="all">Todos os Meses</option>
              <option value="01">Janeiro</option>
              <option value="02">Fevereiro</option>
              <option value="03">Março</option>
              <option value="04">Abril</option>
              <option value="05">Maio</option>
              <option value="06">Junho</option>
              <option value="07">Julho</option>
              <option value="08">Agosto</option>
              <option value="09">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-2 rounded-xl"
              style={{ 
                backgroundColor: '#1E293B',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <Download className="w-5 h-5 text-gray-400" />
            </motion.button>
          </div>
        </div>

        {/* KPI Cards */}
        <SalesKPICardsDark />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Sales Evolution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Total Vendido por Ano</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <TrendingUp className="w-4 h-4 text-green-500" />
                +14% vs ano anterior
              </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={SALES_BY_YEAR}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickFormatter={(value) => `${value}Mi`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'white' }}
                  formatter={(value: number) => [`R$ ${value} Mi`, 'Vendas']}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#8B5CF6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Sales by Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <h3 className="text-lg font-bold text-white mb-6">Total por Marca</h3>

            <div className="space-y-3">
              {SALES_BY_BRAND.map((brand, index) => (
                <div key={brand.name} className="flex items-center gap-3">
                  <span className="w-20 text-sm text-gray-400 truncate">{brand.name}</span>
                  <div className="flex-1 h-8 rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(brand.value / SALES_BY_BRAND[0].value) * 100}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="h-full rounded-lg flex items-center justify-end pr-2"
                      style={{ 
                        background: `linear-gradient(90deg, ${brand.color}80 0%, ${brand.color} 100%)`
                      }}
                    >
                      <span className="text-xs font-medium text-white">
                        {formatCurrency(brand.value)}
                      </span>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Sales by Continent - Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <h3 className="text-lg font-bold text-white mb-6">Total por Continente</h3>

            <ResponsiveContainer width="100%" height={200}>
              <RechartsPie>
                <Pie
                  data={SALES_BY_CONTINENT}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {SALES_BY_CONTINENT.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Participação']}
                />
              </RechartsPie>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {SALES_BY_CONTINENT.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* World Map Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Total por País e Continente</h3>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">Mapa de Vendas</span>
              </div>
            </div>

            {/* Map Placeholder */}
            <div 
              className="h-[250px] rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <div className="text-center">
                <Globe className="w-16 h-16 mx-auto mb-3 text-purple-500 opacity-50" />
                <p className="text-gray-400">Mapa Mundial</p>
                <p className="text-xs text-gray-500">Visualização geográfica de vendas</p>
              </div>
            </div>

            {/* Country Stats */}
            <div className="grid grid-cols-4 gap-4 mt-4">
              <CountryStat country="Brasil" value="R$ 110 Mi" percentage="65%" />
              <CountryStat country="EUA" value="R$ 34 Mi" percentage="20%" />
              <CountryStat country="Europa" value="R$ 17 Mi" percentage="10%" />
              <CountryStat country="Outros" value="R$ 10 Mi" percentage="5%" />
            </div>
          </motion.div>
        </div>

        {/* Pipeline Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Pipeline de Vendas
          </h2>
          <PipelineKPIs />
        </motion.div>

        {/* Top Sellers Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Top Vendedores do Mês
            </h3>
          </div>

          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {TOP_SELLERS.map((seller, index) => (
              <div key={seller.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <span 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ 
                      backgroundColor: index < 3 ? '#F59E0B' : 'rgba(255,255,255,0.1)',
                      color: index < 3 ? '#1E293B' : '#9CA3AF'
                    }}
                  >
                    {index + 1}
                  </span>
                  <img 
                    src={seller.avatar}
                    alt={seller.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-white">{seller.name}</p>
                    <p className="text-xs text-gray-400">{seller.region}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">{formatCurrency(seller.sales)}</p>
                  <p className="text-xs text-green-400">
                    {seller.goalPercentage}% da meta
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Country Stat Component
function CountryStat({ country, value, percentage }: { country: string; value: string; percentage: string }) {
  return (
    <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
      <p className="text-sm text-gray-400">{country}</p>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-purple-400">{percentage}</p>
    </div>
  );
}

// Sample data
const TOP_SELLERS = [
  { id: '1', name: 'Carla Ferreira', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carla', region: 'Sul', sales: 2380000, goalPercentage: 158 },
  { id: '2', name: 'Julio Lima', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=julio', region: 'Sudeste', sales: 1770000, goalPercentage: 118 },
  { id: '3', name: 'Gustavo Gomes', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gustavo', region: 'Centro-Oeste', sales: 1260000, goalPercentage: 105 },
  { id: '4', name: 'Felipe Gonçalves', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=felipe', region: 'Nordeste', sales: 996370, goalPercentage: 83 },
  { id: '5', name: 'Leonardo Cardoso', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=leonardo', region: 'Norte', sales: 900329, goalPercentage: 75 }
];









