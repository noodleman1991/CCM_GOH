// Seed a few starter profile prompts in Sanity (idempotent via fixed ids).
//
// Run with tsx: `pnpm seed:profile-prompts` (the shared orderRank helper is TS).
import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { sequentialOrderRanks } from "../lib/order-rank";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_EDITOR_TOKEN,
  apiVersion: "2024-10-31",
  useCdn: false,
});

const prompts = [
  { id: "profilePrompt-climate-personal", category: "about",
    prompt: { en: "Climate change feels personal to me because…", es: "El cambio climático me toca de cerca porque…", fr: "Le changement climatique me touche personnellement parce que…", ar: "تغير المناخ يهمّني شخصيًا لأن…" } },
  { id: "profilePrompt-proud-project", category: "research",
    prompt: { en: "A project I'm proud of…", es: "Un proyecto del que estoy orgulloso/a…", fr: "Un projet dont je suis fier·ère…", ar: "مشروع أفخر به…" } },
  { id: "profilePrompt-collaborate", category: "collaboration",
    prompt: { en: "I'd love to collaborate on…", es: "Me encantaría colaborar en…", fr: "J'aimerais collaborer sur…", ar: "أودّ التعاون في…" } },
];

// `orderRank` must hold LexoRank strings — the Studio parses them unguarded, so
// a plain ordinal like "000002" crashes it. Seed after whatever already exists.
const lastOrderRank: string | null = await client.fetch(
  `*[_type == "profilePrompt"]|order(orderRank desc)[0].orderRank`,
);
const ranks = sequentialOrderRanks(prompts.length, lastOrderRank);

const tx = client.transaction();
prompts.forEach((p, i) => {
  tx.createIfNotExists({
    _id: p.id, _type: "profilePrompt", active: true, category: p.category,
    prompt: p.prompt, orderRank: ranks[i],
  });
});
await tx.commit();
console.log(`✓ seeded ${prompts.length} profile prompts`);
