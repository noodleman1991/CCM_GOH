import { describe, expect, it } from "vitest";
import config from "@payload-config";

describe("admin sign-in stays alive", () => {
  it("loads Clerk inside the admin so the hub session is renewed while editors work", async () => {
    // Without it, Clerk's 60-second session token expires in the admin and every
    // background request (autosave, save, navigation) is treated as signed out.
    const providers = (await config).admin?.components?.providers ?? [];
    expect(providers).toContain("@/payload/components/clerk-session#ClerkSession");
  });
});
