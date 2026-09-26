import type { Block, Field, GroupField } from "payload";

/**
 * A **named slot** typed on one of the twelve ported blocks.
 *
 * Sanity's `homepage` and `regionalCommunityPage` do not compose from a
 * block array — they declare fixed, named fields whose *type* is a block
 * (`heroWelcome: hero-1`, `globalAgenda: split-row`, `welcomeHero: hero-1`).
 * Payload's `blocks` field only exists in array form, so a single named slot
 * is modelled as a `group` carrying that block's own field list. The block
 * stays the single definition of its shape (payload/blocks/*); nothing is
 * redeclared here.
 *
 * ## Two ways to localize a slot, and why the homepage needs the second
 *
 * `localized: true` (the default, and what `regionalCommunityPage` uses)
 * localizes the slot **container**: every leaf under it — checkbox, select,
 * number, hex colour — gets a column in the owner's `_locales` table. That
 * reproduces Sanity's Lane A (one whole document per language) exactly.
 *
 * It also does not scale. `homepage` has eleven slots; localizing all eleven
 * containers put **135 columns** in `homepage_locales`, and Payload's
 * Postgres adapter reads a localized table through
 * `json_agg(json_build_array(<every column>))` while Postgres caps any
 * function at 100 arguments (`FUNC_MAX_ARGS`, a compile-time constant). The
 * global became unreadable: `findGlobal`, `updateGlobal`, `/admin` and any
 * Phase-3 `getGlobal` all failed with SQLSTATE 54023 (task-12-report.md).
 *
 * `localized: false` is the fix. The container stays unlocalized, so each
 * field keeps **its own** declared localization — and the blocks already draw
 * that line: genuinely translatable copy is declared with
 * `localizedText`/`localizedTextarea`/`localizedRichText`, while presentation
 * settings (`padding.top`, `imagePosition`, `background.color`,
 * `maxItems`, …) are declared as plain fields. Nothing new has to be decided
 * here; the existing declaration is simply no longer overridden by the
 * container.
 *
 * ## Row lists stay localized regardless
 *
 * A slot's `array` and `blocks` children, and any `hasMany` relationship, are
 * forced back to `localized: true` when the container is not. Those hold
 * **ordered rows**, not scalars, and the four Sanity homepage documents
 * genuinely differ in them (different link labels, different split-column
 * bodies, and `news.columns[1..2].newsPost` even points at different news
 * posts in English than in the other three). Localizing the row container
 * keeps one row-set per locale exactly as before — and costs nothing against
 * the 100-argument cap, because those rows live in their own tables
 * (`homepage_hero_welcome_links`, `homepage_blocks_split_content`, …), each
 * with its own `_locale` column.
 *
 * ## Why every slot gets a cloned field list
 *
 * Payload 3.88 strips `localized` from any field whose parent is localized
 * (`sanitizeField`: `if (parentIsLocalized) delete field.localized`) — and it
 * does that by MUTATING the field object. The block consts are module-level
 * singletons shared by every slot and by `page.blocks[]`, which IS localized.
 * So an unlocalized slot sharing those objects would have its `localizedText`
 * markers deleted out from under it by whichever localized usage sanitized
 * first, and the homepage's title/body would silently stop being
 * per-language. `cloneFieldList` gives every slot its own copy, so no
 * sanitize pass can reach another usage. Cloning is structural only: `fields`
 * / `blocks` are rebuilt, everything else (admin conditions, validators, the
 * lexical editor instance) is carried by reference.
 */
export function blockSlot(
  name: string,
  block: Block,
  opts: { label?: string; description?: string; localized?: boolean } = {},
): GroupField {
  const localized = opts.localized ?? true;
  const fields = cloneFieldList(block.fields);
  if (!localized) localizeRowLists(fields);
  return {
    name,
    type: "group",
    localized,
    ...(opts.label ? { label: opts.label } : {}),
    ...(opts.description ? { admin: { description: opts.description } } : {}),
    fields,
  };
}

type Structural = { fields?: Field[]; blocks?: Block[] };

/**
 * A structural deep copy of a field list: `fields` and `blocks` are rebuilt so
 * the copy shares no mutable node with the original, while every other
 * property (functions included) is carried by reference.
 */
export function cloneFieldList(fields: readonly Field[]): Field[] {
  return fields.map((field) => {
    const copy = { ...(field as Record<string, unknown>) } as Record<string, unknown> & Structural;
    if (Array.isArray(copy.fields)) copy.fields = cloneFieldList(copy.fields);
    if (Array.isArray(copy.blocks)) {
      copy.blocks = copy.blocks.map((b) => ({ ...b, fields: cloneFieldList(b.fields) }));
    }
    return copy as unknown as Field;
  });
}

/**
 * Marks every row list in an unlocalized slot `localized: true` — see the
 * "Row lists stay localized" section above. Recursion stops at a localized
 * container because Payload localizes its whole subtree anyway.
 */
function localizeRowLists(fields: Field[]): void {
  for (const field of fields) {
    if (field.type === "array" || field.type === "blocks") {
      field.localized = true;
      continue;
    }
    if (field.type === "relationship" && field.hasMany) {
      field.localized = true;
      continue;
    }
    if ("fields" in field && Array.isArray(field.fields)) localizeRowLists(field.fields);
  }
}
