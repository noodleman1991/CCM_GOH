import type { FieldHook, TextField, Validate } from "payload";
import { tagSlug } from "@/lib/tags/slug";

/** The English text of a plain or localized `{en, es, …}` value. */
export function sourceText(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (value && typeof value === "object") {
    const localized = value as Record<string, unknown>;
    for (const locale of ["en", ...Object.keys(localized)]) {
      const text = localized[locale];
      if (typeof text === "string" && text.trim()) return text.trim();
    }
  }
  return undefined;
}

/** A URL-safe slug; a title with no Latin letters (Arabic, say) gets a short random one. */
export function baseSlug(text: string, maxLength: number): string {
  return tagSlug(text).slice(0, maxLength).replace(/-+$/, "") || `item-${crypto.randomUUID().slice(0, 8)}`;
}

function withSuffix(base: string, n: number, maxLength: number): string {
  if (n === 1) return base;
  const suffix = `-${n}`;
  return `${base.slice(0, maxLength - suffix.length).replace(/-+$/, "")}${suffix}`;
}

function generateSlug(source: string, maxLength: number): FieldHook {
  return async ({ value, data, originalDoc, req, collection }) => {
    if (typeof value === "string" && value.trim()) return value;
    const text = sourceText(data?.[source]) ?? sourceText(originalDoc?.[source]);
    if (!text || !collection) return value;

    const base = baseSlug(text, maxLength);
    const selfId = (originalDoc as { id?: string | number } | undefined)?.id;
    for (let n = 1; n <= 50; n++) {
      const candidate = withSuffix(base, n, maxLength);
      const taken = await req.payload.find({
        collection: collection.slug,
        where: {
          and: [{ slug: { equals: candidate } }, ...(selfId !== undefined ? [{ id: { not_equals: selfId } }] : [])],
        },
        limit: 1,
        depth: 0,
        pagination: false,
        overrideAccess: true,
        req,
      });
      if (taken.docs.length === 0) return candidate;
    }
    return withSuffix(base, Number.parseInt(crypto.randomUUID().slice(0, 6), 16), maxLength);
  };
}

/**
 * A slug editors may leave empty: it is made from `source` on save. The form
 * checks fields before any hook runs, so an empty slug passes there while the
 * source has text, and the hook fills it in before the server's own check.
 */
export function slugField(
  source: string,
  options: { maxLength?: number; description?: string } = {},
): TextField {
  const maxLength = options.maxLength ?? 96;
  const validate: Validate<string> = (value, { data }) => {
    if (typeof value === "string" && value.trim()) {
      return value.length <= maxLength || `Keep the slug to ${maxLength} characters or fewer.`;
    }
    return Boolean(sourceText((data as Record<string, unknown> | undefined)?.[source])) || `Add a ${source} first; the slug is made from it.`;
  };
  const auto = `Leave empty and it is made from the ${source} when you save.`;
  return {
    name: "slug",
    type: "text",
    required: true,
    unique: true,
    ...(options.maxLength ? { maxLength: options.maxLength } : {}),
    validate,
    hooks: { beforeValidate: [generateSlug(source, maxLength)] },
    admin: { description: options.description ? `${options.description} ${auto}` : auto },
  };
}
