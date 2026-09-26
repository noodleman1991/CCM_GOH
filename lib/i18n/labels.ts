/**
 * Enum values → member-facing labels (Slice 14a). A translator with a key
 * for the value wins; otherwise the raw value is humanised here, in one
 * place, instead of `.replace(/_/g, " ")` scattered through JSX (which the
 * i18n guard test now forbids).
 */
type Translator = { (key: string, values?: Record<string, string | number>): string; has: (key: string) => boolean };

export function humanize(value: string): string {
  return value.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

export function enumLabel(t: Translator, value: string | null | undefined, prefix = ""): string {
  if (!value) return "";
  const key = prefix ? `${prefix}.${value}` : value;
  return t.has(key) ? t(key) : humanize(value);
}
