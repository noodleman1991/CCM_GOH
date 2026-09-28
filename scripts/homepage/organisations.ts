/**
 * Partner organisations for the homepage move (CMS project 2, spec §3.4) —
 * pure: which homepage logo is which organisation, and which of the old
 * import's clipped organisation names can be fixed or should be hidden.
 * Nothing is ever deleted; the runner prints every step before it writes.
 */

export interface OrgRow {
  id: string;
  name: string;
  type?: string | null;
  showOnSite?: boolean | null;
  /** Some content links to it. */
  used?: boolean;
}

export interface LogoRow {
  asset: string | null;
  alt: string | null;
  orgType?: string | null;
}

export type PartnerStep =
  | { index: number; name: string; action: "match"; orgId: string }
  | { index: number; name: string; action: "create"; logo: string | null; type: string }
  | { index: number; action: "skip"; reason: string };

export type OrgFix =
  | { id: string; from: string; action: "rename"; to: string }
  | { id: string; from: string; action: "hide" }
  | { id: string; from: string; action: "keep" };

const ORG_TYPES = new Set(["ngo", "research", "university", "government", "international", "company", "community", "foundation", "other"]);

/** Clipped names from the old import whose full name is certain. Shown in the dry run. */
export const NAME_FIXES: Record<string, string> = {
  "cook university": "James Cook University",
  "hopkins university": "Johns Hopkins University",
  "salle university": "La Salle University",
  "khan university": "Aga Khan University",
};

/** Fragments that could be many organisations — hidden, never guessed. */
export const UNCLEAR_NAMES: ReadonlySet<string> = new Set([
  "the university",
  "federal university",
  "policy institute",
  "technological university",
  "kong university",
  "university of science",
  "mind institute",
  "university of rio grande",
]);

const key = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
const nameFromAlt = (alt: string | null) => (alt ?? "").replace(/\s*logo\s*$/i, "").trim();

/**
 * One step per logo, in order: match an existing organisation by name, or
 * create one (its picture becomes the organisation's logo). A second logo for
 * a partner being created matches the placeholder id `new:<name>`, which the
 * runner swaps for the real id.
 */
export function planPartners(logos: LogoRow[], orgs: OrgRow[]): PartnerStep[] {
  const byName = new Map(orgs.map((o) => [key(o.name), o.id]));
  const creating = new Set<string>();
  return logos.map((logo, index): PartnerStep => {
    const name = nameFromAlt(logo.alt);
    if (!name) return { index, action: "skip", reason: "no description to name it by" };
    const k = key(name);
    // Exact name first; else a shortened name that exactly one organisation
    // starts with ("Climate Cares" → "Climate Cares Centre") — never a guess
    // between two.
    const prefixed = orgs.filter(
      (o) => o.showOnSite !== false && !UNCLEAR_NAMES.has(key(o.name)) && (key(o.name).startsWith(`${k} `) || k.startsWith(`${key(o.name)} `)),
    );
    const orgId = byName.get(k) ?? (prefixed.length === 1 ? prefixed[0].id : undefined);
    if (orgId) return { index, name, action: "match", orgId };
    if (creating.has(k)) return { index, name, action: "match", orgId: `new:${k}` };
    creating.add(k);
    return { index, name, action: "create", logo: logo.asset, type: logo.orgType && ORG_TYPES.has(logo.orgType) ? logo.orgType : "other" };
  });
}

/** Rename where the full name is certain; hide unclear fragments nothing links to. */
export function planOrganisationFixes(orgs: OrgRow[]): OrgFix[] {
  return orgs.map((org): OrgFix => {
    const k = key(org.name);
    if (NAME_FIXES[k]) return { id: org.id, from: org.name, action: "rename", to: NAME_FIXES[k] };
    if (UNCLEAR_NAMES.has(k) && !org.used && org.showOnSite !== false) return { id: org.id, from: org.name, action: "hide" };
    return { id: org.id, from: org.name, action: "keep" };
  });
}
