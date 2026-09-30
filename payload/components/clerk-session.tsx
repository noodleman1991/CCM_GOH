import { ClerkProvider } from "@clerk/nextjs";

/**
 * Keeps the hub sign-in alive inside the admin (fixed 2026-09-30).
 *
 * The admin signs editors in through their hub (Clerk) session
 * (payload/auth/clerk-strategy.ts). Clerk's session token lasts about 60
 * seconds and is renewed by Clerk's browser script — which the admin never
 * loaded. Once the token expired, every background request the admin makes
 * (autosave, save, moving between screens) reached Clerk as "signed out"
 * (Clerk only renews tokens on full page loads), so Payload sent the editor
 * to the login page, which renewed the token on its full page load, and so
 * on: "redirected to login over and over". Mounting ClerkProvider here runs
 * the same renewal the hub pages have.
 *
 * `dynamic` for the same reason as the hub layout: without it ClerkProvider
 * renders signed-out on the server and mismatches on hydration.
 */
export function ClerkSession({ children }: { children?: React.ReactNode }) {
  return <ClerkProvider dynamic>{children}</ClerkProvider>;
}

export default ClerkSession;
