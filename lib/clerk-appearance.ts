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
    // No floating-box look: the auth layout already centers the form on a white
    // page, so the Clerk chrome drops its border + shadow and sits flush. The
    // visible outline lives on the OUTER `cardBox` wrapper (not `card`), so both
    // are reset — with `!` since Clerk's own styles are specific. This is the
    // "hide the dialog border" requirement.
    cardBox: "!shadow-none !border-0 !rounded-[var(--radius)] !bg-transparent",
    card: "!shadow-none !border-0 !bg-transparent rounded-[var(--radius)] !px-0",
    // Centered brand mark, sized generously (h-20 ≈ 25% larger than the prior h-16).
    logoBox: "!h-20 justify-center mb-3",
    logoImage: "!h-20 w-auto max-w-none object-contain",
    // Single heading line in Poppins (the brand heading font), sized as a calm
    // section title — not a hero. The subtitle is emptied via localization, so
    // hide its (now-blank) node to avoid a stray gap.
    headerTitle: "font-heading text-ccm-midnight text-xl font-semibold tracking-tight",
    headerSubtitle: "hidden",
    // Labels in Poppins to match the headings; provider/primary button text too.
    formFieldLabel: "font-heading text-ccm-midnight",
    socialButtonsBlockButton:
      "border-border rounded-[var(--radius)] hover:bg-muted transition-colors",
    socialButtonsBlockButtonText: "font-heading",
    formButtonPrimary:
      "bg-[var(--color-ccm-sea)] hover:bg-[var(--color-ccm-midnight)] text-white normal-case font-heading font-medium rounded-[var(--radius)] shadow-sm",
    formFieldInput:
      "border-border rounded-[var(--radius)] focus:border-[var(--color-ccm-water)] focus:ring-[var(--color-ccm-water)]",
    footerActionText: "font-heading",
    footerActionLink:
      "text-[var(--color-ccm-sea)] hover:text-[var(--color-ccm-midnight)] font-heading",
    // The "Sign up" / "Secured by" area sits flush on the page background (no
    // grey gradient, no divider, no opaque white box that stands out) — fully
    // transparent so it blends with the rest of the borderless form.
    footer: "!bg-transparent !border-0 text-muted-foreground",
  },
};
