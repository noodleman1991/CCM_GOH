/**
 * Moves the homepage from its eleven fixed slots onto the Sections list and
 * sets up the partner organisations its logo strip links to (CMS project 2,
 * docs/superpowers/specs/2026-09-28-homepage-on-sections-design.md §3.2, §3.4).
 *
 *   pnpm exec tsx scripts/homepage/move-to-sections.ts [--orgs]                      # dev dry run
 *   pnpm exec tsx scripts/homepage/move-to-sections.ts [--orgs] --execute            # dev write
 *   pnpm exec tsx scripts/homepage/move-to-sections.ts --revert                      # empty the list → old homepage
 *   … --production [--execute]                                                       # PRODUCTION (user only)
 *
 * Dry run by default. Refuses when the homepage already has sections unless
 * `--replace`. The old slots are never touched: they stay as the backup
 * `--revert` falls back to. Nothing is ever deleted.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { planHomepageSections, type LocaleMap } from "./plan";
import { planOrganisationFixes, planPartners, type LogoRow, type OrgFix, type PartnerStep } from "./organisations";
import { guardExisting, swapNewIds, toLocaleData, withIdsFrom } from "./write";
import { collapseLocales } from "../../lib/content/internal/localize";

type Row = Record<string, unknown>;
const LOCALES = ["en", "es", "fr", "ar"] as const;
const LINKED_COLLECTIONS = ["caseStudies", "newsPosts", "researchOutputs", "livedExperiences", "agendas"] as const;

function freshHeading(): LocaleMap {
  return Object.fromEntries(
    LOCALES.map((l) => {
      const messages = JSON.parse(readFileSync(join(process.cwd(), "messages", `${l}.json`), "utf8")) as { typedCards?: { freshHeading?: string } };
      return [l, messages.typedCards?.freshHeading ?? null];
    }),
  );
}

const cell = (v: unknown, width: number) => String(v ?? "—").replace(/\s+/g, " ").slice(0, width).padEnd(width);

function printPartners(steps: PartnerStep[], orgNames: Map<string, string>) {
  console.log("\nPartner logos → organisations");
  for (const s of steps) {
    if (s.action === "skip") console.log(`  ${cell(s.index + 1, 3)} SKIP    ${s.reason}`);
    else if (s.action === "create") console.log(`  ${cell(s.index + 1, 3)} CREATE  ${s.name} (type: ${s.type})`);
    else console.log(`  ${cell(s.index + 1, 3)} MATCH   ${s.name} → ${orgNames.get(s.orgId) ?? s.orgId}`);
  }
}

function printFixes(fixes: OrgFix[]) {
  console.log("\nOrganisation names");
  for (const f of fixes) {
    if (f.action === "rename") console.log(`  RENAME  ${f.from} → ${f.to}`);
    else if (f.action === "hide") console.log(`  HIDE    ${f.from}`);
  }
  const kept = fixes.filter((f) => f.action === "keep").length;
  console.log(`  (${kept} kept as they are)`);
}

function printSections(sections: Row[]) {
  console.log("\nNew homepage sections");
  sections.forEach((s, i) => {
    const heading = (s.heading ?? s.title) as LocaleMap | undefined;
    const langs = LOCALES.map((l) => cell(heading?.[l], 22)).join(" | ");
    console.log(`  ${cell(i + 1, 3)} ${cell(s.blockType, 18)} ${langs}`);
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const execute = argv.includes("--execute");
  const replace = argv.includes("--replace");
  const revert = argv.includes("--revert");
  const withOrgs = argv.includes("--orgs");
  const production = argv.includes("--production") || argv.includes("--allow-production");

  const { assertPayloadDatabase, getPayloadInstance, IMPORT_WRITE_CONTEXT, loadEnv } = await import("../payload-import/lib/runtime");
  await loadEnv();
  assertPayloadDatabase(process.env.PAYLOAD_DATABASE_URL, {
    action: revert ? "put the homepage back on its old sections" : execute ? "move the homepage onto sections" : "read the homepage",
    ...(production ? { allowProduction: true } : {}),
  });
  const payload = await getPayloadInstance();
  const context = IMPORT_WRITE_CONTEXT;

  if (revert) {
    const { SKIP_REQUIRED_SECTIONS } = await import("../../payload/fields/sections");
    const revertContext = { ...context, [SKIP_REQUIRED_SECTIONS]: true };
    await payload.updateGlobal({ slug: "homepage", locale: "en", draft: false, data: { sections: [], layoutPerLanguage: false, _status: "published" } as never, context: revertContext });
    for (const locale of LOCALES) {
      await payload.updateGlobal({ slug: "homepage", locale, draft: false, data: { sectionsByLanguage: [], _status: "published" } as never, context: revertContext });
    }
    console.log("The homepage is back on its old sections. Clear the site cache so visitors see it.");
    process.exit(0);
  }

  const global = (await payload.findGlobal({ slug: "homepage", locale: "all", depth: 0, draft: false })) as unknown as Row;
  const refusal = guardExisting(Array.isArray(global.sections) ? global.sections : [], { replace });
  if (refusal) {
    console.error(refusal);
    process.exit(1);
  }

  const orgs = (await payload.find({ collection: "organizations", pagination: false, depth: 0 })).docs as unknown as Row[];
  const used = new Set<string>();
  for (const collection of LINKED_COLLECTIONS) {
    const rows = (await payload.find({ collection, pagination: false, depth: 0, draft: true, select: { organizations: true } as never })).docs as unknown as Row[];
    for (const row of rows) for (const id of Array.isArray(row.organizations) ? row.organizations : []) used.add(String(id));
  }
  const orgRows = orgs.map((o) => ({ id: String(o.id), name: String(o.name ?? ""), type: (o.type as string) ?? null, showOnSite: o.showOnSite as boolean | null, used: used.has(String(o.id)) }));
  const orgNames = new Map(orgRows.map((o) => [o.id, o.name]));

  const logoSlot = (global.partnerLogos ?? {}) as Row;
  const logos = ((collapseLocales(logoSlot.images, "en") as Row[] | null) ?? []).map(
    (i): LogoRow => ({ asset: i.asset == null ? null : String(i.asset), alt: (i.alt as string) ?? null, orgType: (i.orgType as string) ?? null }),
  );
  const partners = planPartners(logos, orgRows);
  const partnerIds = partners.flatMap((s) => (s.action === "match" ? [s.orgId] : s.action === "create" ? [`new:${s.name.trim().replace(/\s+/g, " ").toLowerCase()}`] : []));
  const fixes = withOrgs ? planOrganisationFixes(orgRows) : [];
  const plan = planHomepageSections({ global, organizationIds: partnerIds, freshHeading: freshHeading() });

  printPartners(partners, orgNames);
  if (withOrgs) printFixes(fixes);
  printSections(plan.sections);
  console.log("\nValues that differed between languages (English kept):");
  if (plan.differences.length === 0) console.log("  none");
  for (const d of plan.differences) console.log(`  ${d.section} · ${d.path} · ${JSON.stringify(d.values)}`);
  for (const note of plan.notes) console.log(`Note: ${note}`);

  if (!execute) {
    console.log("\nDry run — nothing was written. Re-run with --execute to apply.");
    process.exit(0);
  }

  // 1. Partner organisations.
  const created = new Map<string, string>();
  for (const step of partners) {
    if (step.action !== "create") continue;
    const doc = await payload.create({
      collection: "organizations",
      data: { name: step.name, type: step.type, showOnSite: true, ...(step.logo ? { logo: { asset: step.logo, alt: step.name } } : {}) } as never,
      context,
    });
    created.set(`new:${step.name.trim().replace(/\s+/g, " ").toLowerCase()}`, String(doc.id));
    console.log(`Created organisation: ${step.name}`);
  }

  // 2. Organisation names.
  for (const fix of fixes) {
    if (fix.action === "rename") await payload.update({ collection: "organizations", id: fix.id, data: { name: fix.to } as never, context });
    if (fix.action === "hide") await payload.update({ collection: "organizations", id: fix.id, data: { showOnSite: false } as never, context });
  }

  // 3. Sections: English creates the rows, the other languages fill the same rows.
  const sections = plan.sections.map((s) =>
    s.blockType === "logoCloud1" ? { ...s, organizations: swapNewIds((s.organizations as string[]) ?? [], created) } : s,
  );
  await payload.updateGlobal({
    slug: "homepage",
    locale: "en",
    draft: false,
    data: { layoutPerLanguage: false, sections: toLocaleData(sections, "en"), _status: "published" } as never,
    context,
  });
  const saved = (await payload.findGlobal({ slug: "homepage", locale: "en", depth: 0, draft: false })) as unknown as Row;
  for (const locale of ["es", "fr", "ar"] as const) {
    await payload.updateGlobal({
      slug: "homepage",
      locale,
      draft: false,
      data: { sections: withIdsFrom(saved.sections, toLocaleData(sections, locale)), _status: "published" } as never,
      context,
    });
  }
  console.log(`\nDone: ${sections.length} sections written. Clear the site cache so visitors see it:`);
  console.log(`  curl -X POST <site>/api/cache/revalidate -H "Authorization: Bearer $ADMIN_API_KEY" -H 'content-type: application/json' -d '{"all":true}'`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
