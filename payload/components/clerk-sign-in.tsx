/**
 * What /admin/login shows (2026-09-20).
 *
 * The Users collection has `disableLocalStrategy: true` — nobody has a
 * Payload password; the Clerk strategy maps an existing hub session onto a
 * Payload user (payload/auth/clerk-strategy.ts). Payload's login view then
 * renders no form at all, so a signed-out editor saw a blank page. This
 * server component fills it: a sign-in button when there is no session, and
 * a plain explanation when there is one but the account is not an editor.
 *
 * `@clerk/nextjs/server` is imported lazily for the same reason the strategy
 * does: payload.config.ts is loaded by the CLI outside Next, where that
 * module cannot resolve. Inside the admin it always can.
 */
import Link from "next/link";

export async function ClerkSignIn() {
  let signedIn = false;
  try {
    const { auth } = await import("@clerk/nextjs/server");
    signedIn = Boolean((await auth()).userId);
  } catch {
    signedIn = false;
  }

  const box: React.CSSProperties = { maxWidth: "28rem", margin: "0 auto", textAlign: "center", lineHeight: 1.5 };
  const button: React.CSSProperties = {
    display: "inline-block",
    marginTop: "1rem",
    padding: "0.75rem 1.25rem",
    borderRadius: "0.375rem",
    background: "var(--theme-elevation-900, #1f2937)",
    color: "var(--theme-elevation-0, #fff)",
    textDecoration: "none",
    fontWeight: 600,
  };

  if (signedIn) {
    return (
      <div style={box}>
        <h2 style={{ marginBottom: "0.5rem" }}>This account can&apos;t open the editor</h2>
        <p>
          You are signed in to the hub, but the admin is for accounts with the <strong>team editor</strong> or{" "}
          <strong>admin</strong> role. Ask an administrator to change your role, then reload this page.
        </p>
        <Link href="/en/dashboard" style={button}>
          Back to the hub
        </Link>
      </div>
    );
  }

  return (
    <div style={box}>
      <h2 style={{ marginBottom: "0.5rem" }}>Sign in with your hub account</h2>
      <p>
        The editor uses the same sign-in as the site. Editors and administrators come straight back here after signing
        in.
      </p>
      <Link href="/en/sign-in?redirect_url=/admin" style={button}>
        Sign in
      </Link>
    </div>
  );
}

export default ClerkSignIn;
