/**
 * Organisation pages (CMS project 2): one shown organisation by slug, in one
 * language. Hidden organisations (`showOnSite: false`) read as missing, so
 * their page 404s and no link to them can resolve.
 */
import "server-only";
import { queryPreviewable } from "@/lib/content/internal/payload-source";
import { localized, type LocalizedRaw } from "@/lib/content/internal/localized";
import { imageGroup } from "@/lib/content/internal/image-shape";
import type { Locale } from "@/lib/content/types";

type Row = Record<string, unknown>;

export interface Organization {
  id: string;
  name: string;
  acronym: string | null;
  type: string | null;
  website: string | null;
  description: string | null;
  logo: Row | null;
  place: string | null;
  community: { name: string; slug: string } | null;
}

const text = (v: unknown) => (typeof v === "string" && v.length > 0 ? v : null);
const isRow = (v: unknown): v is Row => typeof v === "object" && v !== null && !Array.isArray(v);

function inLocale(value: unknown, locale: Locale): string | null {
  const arms = localized(value as LocalizedRaw);
  return text(arms?.[locale]) ?? text(arms?.en) ?? text(value);
}

export async function findOrganization(slug: string, locale: Locale): Promise<Organization | null> {
  const result = await queryPreviewable<{ docs?: Row[] }>({
    type: "find",
    collection: "organizations",
    locale: "all",
    depth: 2,
    limit: 1,
    pagination: false,
    where: { and: [{ slug: { equals: slug } }, { showOnSite: { not_equals: false } }] },
  });
  const row = result?.docs?.[0];
  if (!row) return null;
  const community = isRow(row.regionalCommunity) ? row.regionalCommunity : null;
  const website = text(row.website);
  return {
    id: String(row.id),
    name: text(row.name) ?? "",
    acronym: text(row.acronym),
    type: text(row.type),
    website: website && /^https?:\/\//i.test(website) ? website : null,
    description: inLocale(row.description, locale),
    logo: imageGroup(row.logo, { asset: ["_id", "url", "mimeType", "lqip", "dimensions"], keys: ["alt"] }),
    place: text(isRow(row.place) ? row.place.text : null),
    community: community && text(community.slug) ? { name: inLocale(community.name, locale) ?? "", slug: String(community.slug) } : null,
  };
}
