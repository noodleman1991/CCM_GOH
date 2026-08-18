import type { Metadata } from "next";
import "../globals.css";
import { cn } from "@/lib/utils";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from "next-intl/server";
import { ClerkProvider } from '@clerk/nextjs';
import { arSA, esES, frFR, enGB } from '@clerk/localizations';
import { rtlLocales } from '@/i18n/routing';
import { Poppins, Lato, Lalezar, Tajawal } from "next/font/google";
import OnboardingRedirectProvider from '@/components/onboarding/onboarding-redirect-provider';
import RevisionAlertProvider from '@/components/submissions/revision-alert-provider';
import { CookieConsentProvider } from '@/components/cookie-consent/cookie-consent-provider';
import { CookieConsentBanner } from '@/components/cookie-consent/cookie-consent-banner';
import { AnalyticsScripts } from '@/components/cookie-consent/analytics-scripts';

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-poppins",
    display: "swap",
});

const lato = Lato({
    subsets: ["latin"],
    weight: ["300", "400", "700"],
    variable: "--font-lato",
    display: "swap",
});

const lalezar = Lalezar({
    subsets: ["arabic"],
    weight: ["400"],
    variable: "--font-lalezar",
    display: "swap",
});

const tajawal = Tajawal({
    subsets: ["arabic"],
    weight: ["300", "400", "500", "700"],
    variable: "--font-tajawal",
    display: "swap",
});

const clerkLocalizationsMap = {
    en: enGB,
    fr: frFR,
    es: esES,
    ar: arSA,
};

// Promote the friendly "Welcome back…" line to be the SOLE sign-in heading and
// drop Clerk's default "Sign in to <app>" title + its now-redundant subtitle.
// Merged per-locale below so each language keeps its own strings.
// `\n` splits the heading onto two lines (rendered via `white-space: pre-line`
// on `.cl-headerTitle` in globals.css): greeting on row 1, instruction on row 2.
const signInHeadings: Record<string, string> = {
    en: "Welcome back!\nPlease sign in to continue",
    fr: "Bon retour !\nVeuillez vous connecter pour continuer",
    es: "¡Bienvenido de nuevo!\nInicia sesión para continuar",
    ar: "مرحبًا بعودتك!\nيرجى تسجيل الدخول للمتابعة",
};

// Clerk's arSA bundle leaves some sign-in placeholders in English; fill the ones
// the form actually shows (email/username + password) per locale.
const emailOrUsernamePlaceholders: Record<string, string> = {
    en: "Enter email or username",
    fr: "Saisissez l'e-mail ou le nom d'utilisateur",
    es: "Introduce el correo o el nombre de usuario",
    ar: "أدخل البريد الإلكتروني أو اسم المستخدم",
};
const passwordPlaceholders: Record<string, string> = {
    en: "Enter your password",
    fr: "Saisissez votre mot de passe",
    es: "Introduce tu contraseña",
    ar: "أدخل كلمة المرور",
};

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
    title: {
        template: "%s | Connecting Climate Minds",
        default: "Hub | Connecting Climate Minds",
    },
    openGraph: {
        images: [
            {
                url: `${process.env.NEXT_PUBLIC_SITE_URL}/images/og-image.jpg`,
                width: 1200,
                height: 630,
            },
        ],
        locale: "en_US",
        type: "website",
    },
    robots: !isProduction ? "noindex, nofollow" : "index, follow",
};

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{locale: string}>;
}) {
    const resolvedParams = await params;
    const { locale } = resolvedParams;
    const isRtl = rtlLocales.includes(locale);
    const messages = await getMessages();
    const baseClerkLocalization = clerkLocalizationsMap[locale as keyof typeof clerkLocalizationsMap] || enGB;
    // One heading line, in Poppins (styled via clerkAppearance.headerTitle): the
    // "Welcome back…" copy becomes the title; the default "Sign in to <app>" and
    // the duplicate subtitle are dropped.
    const clerkLocalization = {
        ...baseClerkLocalization,
        signIn: {
            ...baseClerkLocalization.signIn,
            start: {
                ...baseClerkLocalization.signIn?.start,
                title: signInHeadings[locale] ?? signInHeadings.en,
                subtitle: "",
            },
        },
        formFieldInputPlaceholder__emailAddress_username:
            emailOrUsernamePlaceholders[locale] ?? emailOrUsernamePlaceholders.en,
        formFieldInputPlaceholder__password:
            passwordPlaceholders[locale] ?? passwordPlaceholders.en,
    };

    return (
        <html
            lang={locale}
            dir={isRtl ? 'rtl' : 'ltr'}
            // overscroll-none must live on <html>: the root scroller reads
            // overscroll-behavior from the html element, not body (no
            // body→viewport propagation), so this is what actually stops the
            // rubber-band overscroll flash around the app shell.
            className={`${poppins.variable} ${lato.variable} ${lalezar.variable} ${tajawal.variable} overscroll-none`}
            suppressHydrationWarning
        >
        <head>
            <link rel="icon" href="/favicon.ico" sizes="any" />
        </head>
        <body
            className={cn(
                "min-h-screen bg-background font-sans antialiased overscroll-none overflow-x-hidden",
                poppins.variable,
                lato.variable
            )}
        >
            {/* `dynamic` is required, not optional: without it ClerkProvider
                resolves its auth-state promise to null during SSR, so every
                client component that branches on auth (<SignedIn>/<SignedOut>
                in user-menu-card, useUser() in sidebar-quick-actions) renders
                signed-out on the server and signed-in after Clerk loads —
                a hydration mismatch on every page for signed-in users. */}
            <ClerkProvider localization={clerkLocalization} dynamic>
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="light"
                        disableTransitionOnChange
                    >
                        <OnboardingRedirectProvider>
                            <RevisionAlertProvider>
                                <CookieConsentProvider>
                                    {children}
                                    <CookieConsentBanner />
                                    <AnalyticsScripts />
                                </CookieConsentProvider>
                            </RevisionAlertProvider>
                        </OnboardingRedirectProvider>
                    </ThemeProvider>
                    <Toaster position="top-center" richColors />
                </NextIntlClientProvider>
            </ClerkProvider>
        </body>
        </html>
    );
}
