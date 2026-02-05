import type { MentionCandidate } from '@/lib/mentions/types';

export function filterCandidates(candidates: MentionCandidate[], query: string): MentionCandidate[] {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return candidates.slice(0, 8);

  const scored = candidates
    .map((c) => {
      const label = String(c.label || '').toLowerCase();
      const email = String(c.email || '').toLowerCase();
      const starts = label.startsWith(q) || email.startsWith(q) ? 2 : 0;
      const includes = label.includes(q) || email.includes(q) ? 1 : 0;
      return { c, score: starts + includes };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.c.label.localeCompare(b.c.label))
    .slice(0, 8)
    .map((x) => x.c);

  return scored;
}



