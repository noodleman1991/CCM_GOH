import type { Block, GroupField } from "payload";

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
 * **`localized` defaults to true, and that is load-bearing.** Every consumer
 * of these slots is a Sanity Lane-A type: one document per language (4
 * homepages, 28 regional pages = 7 slugs x 4 languages), each holding its
 * own complete copy of the slot. Localizing at the slot level reproduces
 * that exactly.
 *
 * It also removes a real hazard. Payload 3.88 strips `localized` from any
 * field whose parent is localized (`sanitizeField`:
 * `if (parentIsLocalized) delete field.localized`) — and it does that by
 * MUTATING the field object. The block consts are module-level singletons
 * shared by every slot and every blocks array that uses them, so if some
 * usages had a localized parent and others did not, the first sanitize pass
 * would strip `localized` from the shared field objects and the non-localized
 * usages would silently lose their per-language text. Keeping every Lane-A
 * container localized keeps that mutation uniform: the same shared field
 * objects are stripped the same way no matter which usage sanitizes first.
 * If a future slot needs a non-localized parent, it must be given its own
 * cloned field list rather than the shared block const.
 */
export function blockSlot(
  name: string,
  block: Block,
  opts: { label?: string; description?: string; localized?: boolean } = {},
): GroupField {
  return {
    name,
    type: "group",
    localized: opts.localized ?? true,
    ...(opts.label ? { label: opts.label } : {}),
    ...(opts.description ? { admin: { description: opts.description } } : {}),
    fields: [...block.fields],
  };
}
