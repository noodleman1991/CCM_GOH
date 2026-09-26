/**
 * Length errors from the collaboration server actions, in the member's
 * language (Slice 13a). The actions used to return English strings
 * ("Title must be 1–200 chars.") that the workspace toasts showed verbatim.
 * A server action runs inside the request, so next-intl's server
 * `getTranslations` knows the locale; outside one (vitest, scripts) it throws
 * and the English fallback is returned.
 */
export type LengthErrorKind = "tooLong" | "empty";

const FALLBACK: Record<LengthErrorKind, (max: number) => string> = {
  tooLong: (max) => `Keep this under ${max} characters.`,
  empty: () => "This can't be empty.",
};

export async function lengthError(kind: LengthErrorKind, max = 0): Promise<string> {
  try {
    const { getTranslations } = await import("next-intl/server");
    const t = await getTranslations("collaboration.errors");
    return kind === "tooLong" ? t("tooLong", { max }) : t("empty");
  } catch {
    return FALLBACK[kind](max);
  }
}

/** `{ ok: false, error }` for an empty or over-long value, or null when it is fine. */
export async function lengthProblem(value: string, max: number): Promise<{ ok: false; error: string } | null> {
  if (value.length < 1) return { ok: false, error: await lengthError("empty") };
  if (value.length > max) return { ok: false, error: await lengthError("tooLong", max) };
  return null;
}
