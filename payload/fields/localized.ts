import type { RichTextField, TextareaField, TextField } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

/**
 * Sanity had two i18n lanes: document-level (one `page`/`regionalCommunityPage`
 * document per language) and field-level (`{en, es, fr, ar}` objects on a
 * single document, e.g. `agenda.title`). Payload has one — `localized: true`
 * on a field, with the locale set declared once in payload.config.ts. Both
 * Sanity lanes collapse onto it: a document-per-language type becomes one
 * document with localized fields, and a field-level `{en,es,fr,ar}` object
 * becomes the same localized field with its four values now living in
 * Payload's own locale storage instead of a nested object literal.
 *
 * These three helpers are the single place that decision is made, so every
 * block (payload/blocks/*) gets it for free instead of re-declaring
 * `localized: true` field by field.
 */

type LocalizedTextOptions = Partial<Omit<TextField, "name" | "type">>;
type LocalizedTextareaOptions = Partial<Omit<TextareaField, "name" | "type">>;
type LocalizedRichTextOptions = Partial<Omit<RichTextField, "name" | "type">>;

export function localizedText(name: string, opts: LocalizedTextOptions = {}): TextField {
  return {
    name,
    type: "text",
    localized: true,
    ...opts,
  } as TextField;
}

export function localizedTextarea(name: string, opts: LocalizedTextareaOptions = {}): TextareaField {
  return {
    name,
    type: "textarea",
    localized: true,
    ...opts,
  } as TextareaField;
}

export function localizedRichText(name: string, opts: LocalizedRichTextOptions = {}): RichTextField {
  return {
    name,
    type: "richText",
    localized: true,
    editor: lexicalEditor(),
    ...opts,
  } as RichTextField;
}
