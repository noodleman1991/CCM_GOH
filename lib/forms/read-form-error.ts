/** Reads a rejected form submission; anything unexpected becomes `fallback`, so a reason is never lost. */
export async function readFormError(
  response: Response,
  fallback: string,
): Promise<{ message: string; fields: Record<string, string> }> {
  const body = (await response.json().catch(() => null)) as
    | { error?: { message?: unknown; fields?: unknown } | unknown }
    | null;
  const error = body?.error;
  if (error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string") {
    const shaped = error as { message: string; fields?: unknown };
    const fields =
      shaped.fields && typeof shaped.fields === "object"
        ? Object.fromEntries(
            Object.entries(shaped.fields as Record<string, unknown>).filter(
              (entry): entry is [string, string] => typeof entry[1] === "string",
            ),
          )
        : {};
    return { message: shaped.message, fields };
  }
  return { message: fallback, fields: {} };
}

export function localeHeaders(locale: string): Record<string, string> {
  return { "x-locale": locale };
}
