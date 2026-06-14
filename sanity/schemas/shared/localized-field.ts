import { defineField } from "sanity";

/**
 * Shared supported languages for field-level localized objects ({en,es,fr,ar}).
 * Single source of truth so every Lane-B localized field uses the same set.
 */
export interface SupportedLanguage {
  id: string;
  title: string;
  isDefault?: boolean;
  isRTL?: boolean;
}

export const supportedLanguages: SupportedLanguage[] = [
  { id: "en", title: "English", isDefault: true },
  { id: "es", title: "Español" },
  { id: "fr", title: "Français" },
  { id: "ar", title: "العربية", isRTL: true },
];

interface LocalizedFieldOptions {
  /** Field group to place this under in the Studio (optional). */
  group?: string;
  /** Editor-facing description. */
  description?: string;
  /** Require the default-language (English) value. */
  required?: boolean;
}

/**
 * Define a field-level localized object field: one object with an {en,es,fr,ar}
 * sub-field of the given `type`. Lane B of the i18n model — used for short
 * strings / titles / reference-target labels that live in ONE document.
 *
 * Extracted from case-study.ts so all Lane-B types share one definition.
 */
export function createLocalizedField(
  name: string,
  title: string,
  type: string = "string",
  options: LocalizedFieldOptions = {}
) {
  const { group, description, required = false } = options;
  const requireDefault = required
    ? (Rule: any) => Rule.required()
    : undefined;

  return defineField({
    name,
    title,
    type: "object",
    ...(group ? { group } : {}),
    ...(description ? { description } : {}),
    fields: supportedLanguages.map((lang) => ({
      name: lang.id,
      title: lang.title,
      type,
      validation: lang.isDefault && required ? requireDefault : undefined,
    })),
    validation: required ? requireDefault : undefined,
  });
}
