import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Crown } from 'lucide-react';

interface RankedUser {
  id: string;
  name: string;
  avatar: string;
  points: number;
  position: number;
  trend: 'up' | 'down' | 'stable';
}

interface PodiumRankingProps {
  users: RankedUser[];
  title?: string;
}

export const PodiumRanking: React.FC<PodiumRankingProps> = ({ users, title = 'Ranking Semanal' }) => {
  // Ordenar usuários por posição
  const sortedUsers = [...users].sort((a, b) => a.position - b.position);
  const top3 = sortedUsers.slice(0, 3);
  const rest = sortedUsers.slice(3);

  // Reordenar para visual do pódio: 2º, 1º, 3º
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-50">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-yellow-500" />
          {title}
        </h3>
        <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-medium">
          Atualizado hoje
        </span>
      </div>

      {/* Pódio */}
      <div className="flex justify-center items-end gap-4 mb-8 h-48">
        {podiumOrder.map((user, index) => {
          const isFirst = user.position === 1;
          const isSecond = user.position === 2;
          const height = isFirst ? 'h-full' : isSecond ? 'h-32' : 'h-24';
          
          return (
            <motion.div
              key={user.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.2 }}
              className={`flex flex-col items-center ${isFirst ? 'order-2' : isSecond ? 'order-1' : 'order-3'}`}
            >
              {/* Avatar com Coroa */}
              <div className="relative mb-2">
                {isFirst && (
                  <Crown className="w-6 h-6 text-yellow-400 absolute -top-6 left-1/2 transform -translate-x-1/2 animate-bounce" />
                )}
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className={`object-cover rounded-full border-4 ${
                    isFirst ? 'w-16 h-16 border-yellow-400' : 
                    isSecond ? 'w-14 h-14 border-gray-300' : 
                    'w-12 h-12 border-amber-300'
                  }`}
                />
                <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    isFirst ? 'bg-yellow-400' : 
                    isSecond ? 'bg-gray-400' : 
                    'bg-amber-400'
                }`}>
                  {user.position}
                </div>
              </div>

              {/* Barra do Pódio */}
              <div className={`w-20 ${height} rounded-t-xl flex flex-col justify-end items-center pb-4 ${
                  isFirst ? 'bg-gradient-to-t from-yellow-100 to-yellow-50' : 
                  isSecond ? 'bg-gradient-to-t from-gray-100 to-gray-50' : 
                  'bg-gradient-to-t from-amber-100 to-amber-50'
              }`}>
                <span className="font-bold text-gray-800 text-sm truncate w-full text-center px-1">
                  {user.name.split(' ')[0]}
                </span>
                <span className="text-xs font-semibold text-indigo-600">
                  {user.points}pts
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lista dos Demais */}
      <div className="space-y-3">
        {rest.map((user, index) => (
          <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-400 w-4">{user.position}</span>
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-indigo-600">{user.points} pts</span>
              {user.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <div className="w-4" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};












