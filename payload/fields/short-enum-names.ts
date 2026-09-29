import type { Block, Field } from "payload";
import { cloneFieldList } from "@/payload/fields/block-slot";

/**
 * Postgres caps names at 63 characters, and Payload names a select field's
 * enum `enum_<table>_<field path>`. Sections on a regional community live
 * under `regional_communities_blocks_…` (and `_regional_communities_v_…`), so
 * a few enums run over. Renaming the table would be destructive, so instead
 * each select in these copies gets an `enumName` function: Payload's own name
 * when it fits, else a short stable one derived from it (unique per table).
 * Only applied to the community copies (CMS project 3) — no existing enum moves.
 */

const snake = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase();

/** FNV-1a, 32-bit — deterministic, no Node imports. */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

export function shortEnumName(full: string): string {
  if (full.length <= 63) return full;
  return `${full.slice(0, 50)}_${hash(full)}`.slice(0, 63);
}

type Loose = Field & { name?: string; type: string; fields?: Field[]; blocks?: Block[]; enumName?: unknown };

function walk(fields: Field[], prefix: string): void {
  for (const field of fields as Loose[]) {
    if (field.type === "select" && field.name && !field.enumName) {
      const path = `${prefix}${snake(field.name)}`;
      (field as { enumName?: unknown }).enumName = ({ tableName }: { tableName: string }) => shortEnumName(`enum_${tableName}_${path}`);
    }
    if (field.type === "group" && field.name && Array.isArray(field.fields)) walk(field.fields, `${prefix}${snake(field.name)}_`);
    else if ((field.type === "collapsible" || field.type === "row") && Array.isArray(field.fields)) walk(field.fields, prefix);
    else if (field.type === "array" && Array.isArray(field.fields)) walk(field.fields, ""); // its own table
    if (field.type === "blocks" && Array.isArray(field.blocks)) for (const b of field.blocks) walk(b.fields, ""); // their own tables
  }
}

/** A copy of the block whose select enums always fit Postgres's limit. */
export function withShortEnumNames(block: Block): Block {
  const fields = cloneFieldList(block.fields);
  walk(fields, "");
  return { ...block, fields };
}
