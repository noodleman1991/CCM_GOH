import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { ZodError } from "zod";
import { ERROR_KEYS, type ErrorKey } from "@/lib/validation/error-keys";
import { toFieldIssues, translateIssues, type FieldIssue } from "@/lib/validation/messages";

export type FormErrorBody = { error: { message: string; fields: Record<string, string> } };

const LOCALES = ["en", "es", "fr", "ar"] as const;
type Locale = (typeof LOCALES)[number];

const isLocale = (value: string | null | undefined): value is Locale => LOCALES.includes(value as Locale);

export function requestLocale(request: Request): Locale {
  const header = request.headers.get("x-locale");
  if (isLocale(header)) return header;
  const cookie = request.headers.get("cookie")?.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)?.[1];
  return isLocale(cookie) ? cookie : "en";
}

/** Every rejected form submission answers in this one shape, in the reader's language. */
export async function formErrorResponse({
  request,
  issues,
  formKey = ERROR_KEYS.formFixBelow,
  status = 400,
  input,
  values,
}: {
  request: Request;
  issues?: FieldIssue[] | ZodError;
  formKey?: ErrorKey;
  status?: number;
  input?: unknown;
  values?: Record<string, string | number>;
}): Promise<NextResponse<FormErrorBody>> {
  const t = await getTranslations({ locale: requestLocale(request), namespace: "forms.errors" });
  const list = issues instanceof ZodError ? toFieldIssues(issues) : (issues ?? []);
  const fields = translateIssues(list, t as never, input);
  return NextResponse.json({ error: { message: values ? t(formKey, values) : t(formKey), fields } }, { status });
}

/**
 * The plain-words 429 for a request `rateLimitRequest` refused, keeping the
 * limiter's `Retry-After` so clients still know when to try again.
 */
export async function rateLimitedResponse(request: Request, limited: Response): Promise<NextResponse<FormErrorBody>> {
  const res = await formErrorResponse({ request, formKey: ERROR_KEYS.formRateLimited, status: 429 });
  const retryAfter = limited.headers.get("Retry-After");
  if (retryAfter) res.headers.set("Retry-After", retryAfter);
  return res;
}
