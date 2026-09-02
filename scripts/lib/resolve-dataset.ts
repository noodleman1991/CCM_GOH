export type DatasetResolution =
  | { dataset: string; projectId: string; token: string }
  | { refuse: string };

/**
 * Decides which dataset a run may target from argv + env alone (no I/O), so
 * production is opt-in and never a silent default. Mirrors the refusal in
 * scripts/backfill-region-codes.mjs and scripts/localize-hero-ctas.mjs.
 *
 * `env` is typed as an index signature rather than a named interface: an
 * all-optional named interface is a TypeScript "weak type", and process.env
 * (NodeJS.ProcessEnv, itself an index signature plus a required NODE_ENV) has
 * no named property in common with it, so passing process.env — or a plain
 * test fixture missing NODE_ENV — would fail to typecheck against either a
 * weak named interface or NodeJS.ProcessEnv directly.
 */
export function resolveDataset(
  argv: string[],
  env: Record<string, string | undefined>,
): DatasetResolution {
  const prod = argv.includes("--prod");
  const dataset = env.NEXT_PUBLIC_SANITY_DATASET;
  const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const token = env.SANITY_API_READ_TOKEN;

  if (!dataset || !projectId || !token) {
    return { refuse: "Missing NEXT_PUBLIC_SANITY_DATASET / _PROJECT_ID / SANITY_API_READ_TOKEN" };
  }

  if (dataset === "production_2" && !prod) {
    return {
      refuse:
        'Refusing: the resolved dataset is "production_2" but --prod was not passed.\n' +
        "Re-run with --prod to export production deliberately.",
    };
  }

  return { dataset, projectId, token };
}
