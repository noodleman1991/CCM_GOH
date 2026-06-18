/**
 * Parse @username mentions from a comment body. Usernames match the app's
 * username rules (alphanumeric, underscore, hyphen, dot). Pure + testable.
 * Capped to avoid mention-bombing.
 */

const MENTION_RE = /(?:^|[^\w@])@([a-zA-Z0-9_.-]{2,40})/g;
const MAX_MENTIONS = 10;

export function parseMentions(body: string): string[] {
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  MENTION_RE.lastIndex = 0;
  while ((m = MENTION_RE.exec(body)) !== null) {
    found.add(m[1].toLowerCase());
    if (found.size >= MAX_MENTIONS) break;
  }
  return [...found];
}
