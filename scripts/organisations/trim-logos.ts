/**
 * Trims each organisation's logo file down to the logo itself (user,
 * 2026-10-02: most partner logos were square white files with the logo in a
 * thin band across the middle, so they rendered tiny in every logo strip).
 *
 *   pnpm exec tsx scripts/organisations/trim-logos.ts                 # dev dry run
 *   pnpm exec tsx scripts/organisations/trim-logos.ts --execute       # dev write
 *   pnpm exec tsx scripts/organisations/trim-logos.ts --revert --execute
 *   … --production [--execute | --revert]                             # PRODUCTION (user only)
 *
 * The trimmed logo is saved as a NEW picture and the organisation points at
 * it; the original picture is kept. backups/trim-logos-<time>.json records
 * which picture each organisation had, and --revert points them back.
 * Logos that already fill their file are left alone. Dry run by default.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { logoCrop } from "../../lib/logos/ink-box";

type Row = Record<string, unknown>;
const BACKUP_DIR = path.resolve(process.cwd(), "backups");
const PREFIX = "trim-logos-";

async function main() {
  const argv = process.argv.slice(2);
  const execute = argv.includes("--execute");
  const revert = argv.includes("--revert");
  const production = argv.includes("--production") || argv.includes("--allow-production");

  const { assertPayloadDatabase, getPayloadInstance, IMPORT_WRITE_CONTEXT, loadEnv } = await import("../payload-import/lib/runtime");
  await loadEnv();
  assertPayloadDatabase(process.env.PAYLOAD_DATABASE_URL, {
    action: revert ? "point organisations back at their original logos" : execute ? "trim organisation logos" : "read organisation logos",
    ...(production ? { allowProduction: true } : {}),
  });
  const payload = await getPayloadInstance();
  const context = IMPORT_WRITE_CONTEXT;
  const setLogo = (id: string, asset: string, alt: unknown) =>
    payload.update({ collection: "organizations", id, locale: "en", depth: 0, data: { logo: { asset, alt: typeof alt === "string" ? alt : null } } as never, context });

  if (revert) {
    const newest = readdirSync(BACKUP_DIR).filter((f) => f.startsWith(PREFIX)).sort().at(-1);
    if (!newest) {
      console.log("No backup found in backups/ — nothing to put back.");
      process.exit(1);
    }
    const backup = JSON.parse(readFileSync(path.join(BACKUP_DIR, newest), "utf8")) as Array<{ id: string; name: string; asset: string; alt: unknown }>;
    console.log(`Putting back ${newest}: ${backup.length} organisation logo(s).`);
    if (!execute) {
      console.log("Dry run — add --execute to put them back.");
      process.exit(0);
    }
    for (const b of backup) {
      await setLogo(b.id, b.asset, b.alt);
      console.log(`  ${b.name}: original logo back.`);
    }
    console.log("Done. Clear the site cache so visitors see it.");
    process.exit(0);
  }

  const orgs = (await payload.find({ collection: "organizations", pagination: false, depth: 1, locale: "en", sort: "name" })).docs as unknown as Row[];
  const plans: Array<{ id: string; name: string; slug: string; asset: Row; alt: unknown; crop: NonNullable<ReturnType<typeof logoCrop>>; bytes: Buffer }> = [];
  for (const org of orgs) {
    const name = String(org.name ?? org.slug ?? org.id);
    const logo = (org.logo ?? null) as Row | null;
    const asset = (logo?.asset ?? null) as Row | null;
    const url = typeof asset?.url === "string" ? asset.url : null;
    if (!asset || !url) continue;
    if (!/^https?:\/\//.test(url)) {
      console.log(`  ${name}: logo is stored locally (${url}) — skipped.`);
      continue;
    }
    if (asset.mimeType === "image/svg+xml") {
      console.log(`  ${name}: SVG — scales cleanly, left alone.`);
      continue;
    }
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`  ${name}: couldn't download the logo (${res.status}) — skipped.`);
      continue;
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const crop = logoCrop(data, info.width, info.height);
    if (!crop) {
      console.log(`  ${name}: already fills its file.`);
      continue;
    }
    const share = (n: number, of: number) => `${Math.round((100 * n) / of)}%`;
    console.log(`  ${name}: logo fills ${share(crop.width, info.width)} × ${share(crop.height, info.height)} of its file — trim to ${crop.width}×${crop.height}.`);
    plans.push({ id: String(org.id), name, slug: String(org.slug ?? org.id), asset, alt: logo?.alt, crop, bytes });
  }
  console.log(`\n${plans.length} logo(s) to trim.`);

  if (!execute) {
    console.log("Dry run — nothing was written. Re-run with --execute to apply.");
    process.exit(0);
  }
  if (plans.length === 0) process.exit(0);

  mkdirSync(BACKUP_DIR, { recursive: true });
  const file = path.join(BACKUP_DIR, `${PREFIX}${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify(plans.map((p) => ({ id: p.id, name: p.name, asset: String(p.asset.id), alt: p.alt })), null, 2));
  console.log(`Saved which logo each organisation had to ${path.relative(process.cwd(), file)} (for --revert).`);

  let failures = 0;
  for (const p of plans) {
    try {
      const trimmed = await sharp(p.bytes).extract(p.crop).png().toBuffer();
      const created = await payload.create({
        collection: "media",
        locale: "en",
        data: { alt: typeof p.alt === "string" && p.alt ? p.alt : p.name } as never,
        file: { data: trimmed, mimetype: "image/png", name: `${p.slug}-logo.png`, size: trimmed.byteLength },
        context,
      });
      await setLogo(p.id, String(created.id), p.alt);
      console.log(`  ${p.name}: done.`);
    } catch (error) {
      failures++;
      console.error(`  ${p.name}: FAILED`, error);
    }
  }
  console.log(`\nFinished${failures ? ` with ${failures} failure(s)` : ""}. Clear the site cache so visitors see it.`);
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
