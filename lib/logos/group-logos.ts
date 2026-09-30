/**
 * The logo wall's groups (regions-and-partners spec §3.4): Funded by and
 * Hosted by first, then partners, then unlinked logos. An organisation shows
 * once — in its most prominent place — and the editor's order is kept. Pure.
 */
export type LeadRole = "fundedBy" | "hostedBy";

export function groupLogos<T extends { id: string }>(input: { fundedBy: T[]; hostedBy: T[]; partners: T[]; others: T[] }): {
  leads: Array<{ item: T; role: LeadRole }>;
  partners: T[];
  others: T[];
} {
  const seen = new Set<string>();
  const take = (list: T[]) => list.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
  const leads = [
    ...take(input.fundedBy).map((item) => ({ item, role: "fundedBy" as const })),
    ...take(input.hostedBy).map((item) => ({ item, role: "hostedBy" as const })),
  ];
  return { leads, partners: take(input.partners), others: take(input.others) };
}
