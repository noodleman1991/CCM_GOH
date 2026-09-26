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

export function BrandIcon() {
  // eslint-disable-next-line @next/next/no-img-element -- same
  return <img className="ccm-brand-icon" src="/connecting-climate-minds-logo.png" alt="" aria-hidden="true" />;
}

export default BrandLogo;
