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
    // The app's own base radius (globals.css `--radius: 0.625rem`), not a
    // hard-coded approximation — so inputs/buttons match app controls exactly.
    borderRadius: "var(--radius)",
    // Use the app's body-font token (not a hard-coded family): it resolves to
    // Lato for Latin locales and Tajawal under the RTL/`ar` block in globals.css,
    // so Arabic sign-in renders in the correct Arabic font automatically. Headings
    // use `font-heading` (Poppins → Lalezar in `ar`) via the element overrides.
    fontFamily: "var(--font-body)",
  },
  elements: {
    rootBox: "w-full",
    // Card keeps a WHITE background + radius (so the MODAL variant is opaque over
    // its overlay) but drops the border + shadow so the dedicated /sign-in page
    // doesn't look like a floating box on the white page. We do NOT force
    // overflow-visible here — that would break the modal's internal scroll; the
    // card's own horizontal padding (kept, not zeroed) is what insets the
    // full-width buttons so they're never clipped. Borderless/flush + font +
    // modal-scroll rules live in the `.cl-*` block in globals.css.
    cardBox: "!shadow-none !border-0",
    card: "!shadow-none !border-0",
    // Centered brand mark, sized generously (h-20 ≈ 25% larger than the prior h-16).
    logoBox: "!h-20 justify-center mb-3",
    logoImage: "!h-20 w-auto max-w-none object-contain",
    // Single calm section title (not a hero); subtitle emptied via localization.
    headerTitle: "text-ccm-midnight text-xl font-semibold tracking-tight",
    headerSubtitle: "hidden",
    formFieldLabel: "text-ccm-midnight",
    // Match the app's Button variants exactly (components/ui/button.tsx):
    // social/provider = `outline`, primary = `default`. Same radius (rounded-lg),
    // weight (font-bold), height (min-h-10), and ccm-sea/midnight colours.
    socialButtonsBlockButton:
      "min-h-10 rounded-lg border border-[var(--color-ccm-sea)] bg-transparent font-bold text-[var(--color-ccm-sea)] normal-case hover:bg-[var(--color-ccm-sea)]/10 hover:border-[var(--color-ccm-sea)]/80",
    formButtonPrimary:
      "min-h-10 rounded-lg bg-[var(--color-ccm-sea)] font-bold text-white normal-case hover:bg-[var(--color-ccm-midnight)]",
    formFieldInput:
      "border-border rounded-lg focus:border-[var(--color-ccm-water)] focus:ring-[var(--color-ccm-water)]",
    footerActionLink:
      "text-[var(--color-ccm-sea)] hover:text-[var(--color-ccm-midnight)]",
    footer: "text-muted-foreground",
  },
};
