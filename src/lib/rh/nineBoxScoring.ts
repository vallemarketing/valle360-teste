export type NineBoxLevel = 'low' | 'mid' | 'high';
export type NineBoxQuadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q5' | 'Q6' | 'Q7' | 'Q8' | 'Q9';

export function levelFromScore(score: number): NineBoxLevel {
  if (score <= 2.33) return 'low';
  if (score <= 3.66) return 'mid';
  return 'high';
}

export function quadrantFromLevels(performance: NineBoxLevel, potential: NineBoxLevel): NineBoxQuadrant {
  // Potencial = eixo Y (vertical), Desempenho = eixo X (horizontal)
  // low/low = Q1 (inferior esquerdo) ... high/high = Q9 (superior direito)
  if (potential === 'low' && performance === 'low') return 'Q1';
  if (potential === 'low' && performance === 'mid') return 'Q2';
  if (potential === 'low' && performance === 'high') return 'Q3';

  if (potential === 'mid' && performance === 'low') return 'Q4';
  if (potential === 'mid' && performance === 'mid') return 'Q5';
  if (potential === 'mid' && performance === 'high') return 'Q6';

  if (potential === 'high' && performance === 'low') return 'Q7';
  if (potential === 'high' && performance === 'mid') return 'Q8';
  return 'Q9';
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function weightedAverage(items: Array<{ score: number; weight: number }>): number {
  const valid = items.filter((x) => Number.isFinite(x.score) && Number.isFinite(x.weight) && x.weight > 0);
  const denom = valid.reduce((sum, x) => sum + x.weight, 0);
  if (!denom) return 1;
  const num = valid.reduce((sum, x) => sum + x.score * x.weight, 0);
  return num / denom;
}


