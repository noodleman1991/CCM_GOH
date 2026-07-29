import { notFound } from "next/navigation";

import { DevStandardsClient } from "./standards-client";

/**
 * Dev-only rendered-validation bench for the Gate-2 polish standard —
 * the tab variants, filter bar and card text-guard rendered in isolation so
 * each build slice can be verified at 1440/375 in en + ar without waiting for
 * an adopting surface (several are Clerk-gated). Never ships: 404 in prod.
 */
export default function DevStandardsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DevStandardsClient />;
}
