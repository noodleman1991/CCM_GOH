import { describe, expect, it } from "vitest";
import { PRODUCTION_ENV_FALLBACK_KEYS, productionEnvFallback } from "@/scripts/payload-import/lib/runtime";

/**
 * `.env` is this repo's PRODUCTION environment file; `.env.local` is dev.
 * The import runtime used to load `.env` wholesale as a fallback for anything
 * `.env.local` left out, on the reasoning that only the R2 credentials live
 * there. That was true of the credentials but not of the consequences: it is
 * also how the scripts came to hold the live Algolia admin key, the Resend
 * key and the production Sanity tokens, so any hook or helper they touched
 * had production reach.
 *
 * The fallback is now an allowlist: the object-store variables the asset
 * import genuinely needs, and nothing else.
 */
describe("productionEnvFallback", () => {
  const parsed = {
    R2_ENDPOINT: "https://acc.r2.cloudflarestorage.com",
    R2_ACCESS_KEY_ID: "key",
    R2_SECRET_ACCESS_KEY: "secret",
    R2_BUCKET: "ccm-collab",
    PAYLOAD_R2_BUCKET: "ccm-cms",
    ALGOLIA_API_KEY: "admin-key",
    RESEND_API_KEY: "re_live",
    SANITY_API_WRITE_TOKEN: "sk",
    PAYLOAD_DATABASE_URL: "postgresql://prod/payload_cms",
    DATABASE_URL: "postgresql://prod/goh",
  };

  it("passes through only the object-store variables", () => {
    expect(productionEnvFallback(parsed, {})).toEqual({
      R2_ENDPOINT: parsed.R2_ENDPOINT,
      R2_ACCESS_KEY_ID: parsed.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: parsed.R2_SECRET_ACCESS_KEY,
      R2_BUCKET: parsed.R2_BUCKET,
      PAYLOAD_R2_BUCKET: parsed.PAYLOAD_R2_BUCKET,
    });
  });

  it("never supplies a database URL, a search key, a mail key or a Sanity token", () => {
    const out = productionEnvFallback(parsed, {});
    for (const key of ["PAYLOAD_DATABASE_URL", "DATABASE_URL", "ALGOLIA_API_KEY", "RESEND_API_KEY", "SANITY_API_WRITE_TOKEN"]) {
      expect(out, key).not.toHaveProperty(key);
    }
  });

  it("does not overwrite a value the dev file already set", () => {
    const out = productionEnvFallback(parsed, { R2_BUCKET: "ccm-dev" });
    expect(out).not.toHaveProperty("R2_BUCKET");
    expect(out.R2_ENDPOINT).toBe(parsed.R2_ENDPOINT);
  });

  it("publishes the allowlist, so a reviewer can see what production can still supply", () => {
    expect([...PRODUCTION_ENV_FALLBACK_KEYS].sort()).toEqual(
      [
        "R2_ENDPOINT",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET",
        "PAYLOAD_R2_BUCKET",
        "CLOUDFLARE_R2_ENDPOINT",
        "CLOUDFLARE_R2_ACCESS_KEY_ID",
        "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
        "CLOUDFLARE_R2_BUCKET_NAME",
      ].sort(),
    );
  });
});
