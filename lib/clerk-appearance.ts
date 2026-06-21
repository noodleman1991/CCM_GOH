import type { SignIn } from "@clerk/nextjs";
import type { ComponentProps } from "react";

/** The `appearance` prop type, sourced from Clerk's own component props so we
 *  don't depend on the bundled @clerk/types entry point being resolvable. */
type ClerkAppearance = NonNullable<ComponentProps<typeof SignIn>["appearance"]>;

/**
 * Brand styling for Clerk's hosted UI components (SignIn, SignUp, UserButton,
 * and the modal SignIn/SignUp buttons). This is the `appearance` prop API,
 * which is available on the FREE Clerk plan — it's client-side theming via CSS
 * variables + element class overrides, not the paid dashboard "themes" feature.
 *
 * We theme primarily through `variables` (Clerk derives most of its palette
 * from these) and add a few `elements` tweaks to match the app: our card
 * radius, border, and font. Colours come from the CCM palette in globals.css.
 */
export const clerkAppearance: ClerkAppearance = {
  layout: {
    // Show the CCM logo at the top of the sign-in / sign-up card. Use the
    // colour logo (not the white one) since the card background is white.
    logoImageUrl: "/connecting-climate-minds-logo.png",
    logoPlacement: "inside",
    logoLinkUrl: "/",
  },
  variables: {
    colorPrimary: "#205596", // --color-ccm-sea
    colorText: "#0B3160", // --color-ccm-midnight
    // ccm-sea, not the lighter ccm-water: secondary body text at ~13px needs
    // 4.5:1 on white for WCAG AA. ccm-water (#4186C3) was only 3.87:1.
    colorTextSecondary: "#205596", // --color-ccm-sea
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#0B3160",
    borderRadius: "0.75rem", // matches our rounded-xl cards
    fontFamily: "var(--font-poppins), system-ui, sans-serif",
  },
  elements: {
    // Render inside our own auth layout card, so drop Clerk's outer chrome.
    rootBox: "w-full",
    card: "shadow-none border border-border bg-card rounded-xl",
    // Hard-coded 4× the original h-10 logo (h-40 = 160px) on the auth cards.
    // Clerk applies its own logo sizing, so force ours with `!` (important).
    logoBox: "!h-40 justify-center",
    logoImage: "!h-40 w-auto max-w-none object-contain",
    headerTitle: "font-heading text-ccm-midnight",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButton:
      "border-border hover:bg-muted transition-colors",
    formButtonPrimary:
      "bg-[var(--color-ccm-sea)] hover:bg-[var(--color-ccm-midnight)] text-white normal-case font-medium shadow-sm",
    formFieldInput:
      "border-border focus:border-[var(--color-ccm-water)] focus:ring-[var(--color-ccm-water)]",
    footerActionLink:
      "text-[var(--color-ccm-sea)] hover:text-[var(--color-ccm-midnight)]",
    // Clerk's free-plan branding line; keep it but tone it down.
    footer: "text-muted-foreground",
  },
};
