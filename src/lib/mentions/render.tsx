import React from 'react';
import type { PublicUserProfile } from '@/lib/messaging/userProfiles';

type Props = {
  text: string;
  profilesById?: Map<string, PublicUserProfile>;
  highlightUserId?: string;
  className?: string;
};

const TOKEN_RE = /@\{([0-9a-fA-F-]{36})\}/g;

export function MentionsText({ text, profilesById, highlightUserId, className }: Props) {
  const s = String(text || '');
  const parts: Array<
    | { type: 'text'; value: string; key: string }
    | { type: 'mention'; userId: string; key: string }
  > = [];

  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(s))) {
    const start = m.index;
    const end = start + m[0].length;
    if (start > lastIndex) {
      parts.push({ type: 'text', value: s.slice(lastIndex, start), key: `t-${lastIndex}` });
    }
    parts.push({ type: 'mention', userId: m[1], key: `m-${start}` });
    lastIndex = end;
  }
  if (lastIndex < s.length) {
    parts.push({ type: 'text', value: s.slice(lastIndex), key: `t-${lastIndex}` });
  }

  return (
    <span className={className}>
      {parts.map((p) => {
        if (p.type === 'text') return <React.Fragment key={p.key}>{p.value}</React.Fragment>;

        const profile = profilesById?.get(p.userId);
        const label = profile?.full_name || 'Usuário';
        const isHighlight = highlightUserId && p.userId === highlightUserId;

        return (
          <span
            key={p.key}
            className={[
              'inline-flex items-center rounded-md px-1.5 py-0.5 mx-0.5',
              isHighlight
                ? 'bg-yellow-200/80 text-yellow-900 dark:bg-yellow-400/20 dark:text-yellow-200'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200',
            ].join(' ')}
            data-mention-user-id={p.userId}
            title={profile?.email || undefined}
          >
            @{label}
          </span>
        );
      })}
    </span>
  );
}



