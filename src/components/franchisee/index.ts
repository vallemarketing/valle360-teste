/**
 * Valle 360 - Franchisee Components
 * Componentes para gestão de franqueados
 */

export { FranchiseeCard } from './FranchiseeCard';
export { FranchiseePipeline } from './FranchiseePipeline';
export { FranchiseeRanking } from './FranchiseeRanking';

export default {
  FranchiseeCard: () => import('./FranchiseeCard'),
  FranchiseePipeline: () => import('./FranchiseePipeline'),
  FranchiseeRanking: () => import('./FranchiseeRanking')
};

