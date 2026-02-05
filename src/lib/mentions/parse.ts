export type Mention = {
  userId: string; // auth.users.id
  raw: string; // "@{uuid}"
  index: number;
};

// Canonical format: "@{authUserId}"
const MENTION_RE = /@\{([0-9a-fA-F-]{36})\}/g;

export function parseMentions(text: string): Mention[] {
  const s = String(text || '');
  const out: Mention[] = [];
  let match: RegExpExecArray | null;
  while ((match = MENTION_RE.exec(s))) {
    const userId = match[1];
    out.push({ userId, raw: match[0], index: match.index });
  }
  return out;
}

export function extractMentionUserIds(text: string): string[] {
  const ids = parseMentions(text).map((m) => m.userId);
  return Array.from(new Set(ids));
}

export type ActiveMentionQuery =
  | { active: false }
  | { active: true; startIndex: number; endIndex: number; query: string };

/**
 * Detecta se o cursor está em uma sequência de mention iniciada por "@"
 * Ex.: "Oi @jo" (cursor após "o") => {startIndex do @, endIndex do cursor, query:"jo"}
 */
export function getActiveMentionQuery(value: string, caretIndex: number): ActiveMentionQuery {
  const text = String(value || '');
  const caret = Math.max(0, Math.min(text.length, caretIndex));
  const before = text.slice(0, caret);

  // acha o último @ antes do cursor
  const at = before.lastIndexOf('@');
  if (at < 0) return { active: false };

  // se tem whitespace entre @ e cursor, não é mention ativa
  const between = before.slice(at + 1);
  if (/\s/.test(between)) return { active: false };

  // se já virou canônico "@{", não abrir autocomplete
  if (between.startsWith('{')) return { active: false };

  // não ativar se @ for parte de email (caractere antes não é whitespace/pontuação de separação)
  const prevChar = at > 0 ? before[at - 1] : '';
  if (prevChar && /[0-9a-zA-Z._%+-]/.test(prevChar)) return { active: false };

  const query = between;
  return { active: true, startIndex: at, endIndex: caret, query };
}

export function applyMentionReplacement(args: {
  value: string;
  startIndex: number;
  endIndex: number;
  userId: string;
  trailingSpace?: boolean;
}): { nextValue: string; nextCaretIndex: number } {
  const { value, startIndex, endIndex, userId } = args;
  const trailingSpace = args.trailingSpace !== false;

  const before = value.slice(0, startIndex);
  const after = value.slice(endIndex);
  const token = `@{${userId}}`;
  const insertion = trailingSpace ? `${token} ` : token;
  const nextValue = `${before}${insertion}${after}`;
  const nextCaretIndex = (before + insertion).length;
  return { nextValue, nextCaretIndex };
}



