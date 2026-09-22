/**
 * What /admin/login shows (2026-09-20, redesigned 2026-09-22).
 *
 * The Users collection has `disableLocalStrategy: true` — nobody has a
 * Payload password; the Clerk strategy maps an existing hub session onto a
 * Payload user (payload/auth/clerk-strategy.ts). Payload's login view then
 * renders no form at all, so a signed-out editor saw a blank page. This
 * server component fills it, in the hub's own language: the welcome
 * illustration (the open door to a networked globe) beside a plain sign-in
 * panel. A signed-in visitor without an editor role gets the same frame
 * with an explanation instead of a button.
 *
 * Styling lives in app/(payload)/custom.scss under `.ccm-login`.
 *
 * `@clerk/nextjs/server` is imported lazily for the same reason the strategy
 * does: payload.config.ts is loaded by the CLI outside Next, where that
 * module cannot resolve. Inside the admin it always can.
 */
import Link from "next/link";

const FEATURES = ["Review what members submit", "Publish stories, research and news", "Edit every page in four languages"];

export async function ClerkSignIn() {
  let signedIn = false;
  try {
    const { auth } = await import("@clerk/nextjs/server");
    signedIn = Boolean((await auth()).userId);
  } catch {
    signedIn = false;
  }

  return (
    <div className="ccm-login">
      <aside className="ccm-login__aside" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- /public assets inside the admin; the optimizer is not wanted here */}
        <img className="ccm-login__logo" src="/connecting-climate-minds-logo.png" alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element -- same */}
        <img className="ccm-login__art" src="/illustrations/hubWelcomeToTheHub.webp" alt="" />
        <ul className="ccm-login__features">
          {FEATURES.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </aside>

      <section className="ccm-login__panel">
        <p className="ccm-login__eyebrow">Connecting Climate Minds · Editor</p>
        {signedIn ? (
          <>
            <h1 className="ccm-login__title">This account can&apos;t open the editor</h1>
            <p className="ccm-login__lead">
              You are signed in to the hub, but the editor is for accounts with the <strong>team editor</strong> or{" "}
              <strong>admin</strong> role. Ask an administrator to change your role, then reload this page.
            </p>
            <Link href="/en/dashboard" className="ccm-login__button ccm-login__button--secondary">
              Back to the hub
            </Link>
          </>
        ) : (
          <>
            <h1 className="ccm-login__title">Sign in to the editor</h1>
            <p className="ccm-login__lead">
              Use your hub account. Editors and administrators come straight back here after signing in.
            </p>
            <Link href="/en/sign-in?redirect_url=/admin" className="ccm-login__button">
              Sign in with your hub account
            </Link>
            <p className="ccm-login__foot">
              Not an editor? <Link href="/en">Go to the hub</Link>
            </p>
          </>
        )}
      </section>
    </div>
  );
}

export default ClerkSignIn;
