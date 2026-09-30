import Link from "next/link";

/**
 * The hub's mark in the admin (2026-09-22): the login page's header slot
 * (`admin.components.graphics.Logo`) and the nav's icon slot (`graphics.Icon`).
 * Plain <img> on purpose: the admin is a client boundary inside the Next app,
 * and these two files sit in /public, already served without the optimizer.
 */
export function BrandLogo() {
  // eslint-disable-next-line @next/next/no-img-element -- /public asset inside the admin; the optimizer is not wanted here
  return <img className="ccm-brand-logo" src="/connecting-climate-minds-logo.png" alt="Connecting Climate Minds" />;
}

/** The breadcrumb's home link (`graphics.Icon`): the plain word "Admin" —
 *  the logo lives at the top of the side panel (user, 2026-09-30). */
export function BrandIcon() {
  return <span className="ccm-admin-crumb">Admin</span>;
}

/** The logo at the top of the side panel — also the phone menu drawer
 *  (`admin.components.beforeNavLinks`). Links to the admin home. */
export function BrandNavLogo() {
  return (
    <Link className="ccm-nav-logo" href="/admin" aria-label="Connecting Climate Minds — editor home">
      {/* eslint-disable-next-line @next/next/no-img-element -- same */}
      <img src="/connecting-climate-minds-logo.png" alt="" />
    </Link>
  );
}

export default BrandLogo;
