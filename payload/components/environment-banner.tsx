/**
 * On any copy of the admin that isn't the live site (a laptop, a preview), a
 * strip at the top says so: its database isn't production's, so nothing done
 * here reaches the hub. Only admins can open these copies (payload/access/leads.ts
 * mayUseAdmin); editors always work on the live site (user, 2026-10-08).
 * A server component reading the deployment's environment — pure, no imports.
 */
export function EnvironmentBanner() {
  if (process.env.VERCEL_ENV === "production") return null;
  const where = process.env.VERCEL_ENV === "preview" ? "a preview copy" : "a development copy";
  return (
    <div className="ccm-env-banner" role="note">
      <strong>This is {where} of the admin.</strong> Changes here don&apos;t reach the live hub — edit at{" "}
      <a href="https://hub.connectingclimateminds.org/admin">hub.connectingclimateminds.org/admin</a>.
    </div>
  );
}
