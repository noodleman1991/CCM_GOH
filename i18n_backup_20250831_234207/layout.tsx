import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from "next-intl/server";
import { ClerkProvider } from '@clerk/nextjs';
import { arSA, esES, frFR, enGB } from '@clerk/localizations';
// import { notFound } from 'next/navigation';
// import { routing } from '@/i18n/routing';
import { rtlLocales } from '@/i18n/routing';
import { Poppins, Lato } from "next/font/google";
import { headers } from 'next/headers';

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

const clerkLocalizationsMap = {
    en: enGB,
    fr: frFR,
    es: esES,
    ar: arSA,
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

// Server-side component to render content with conditional sidebar
async function ConditionalSidebarContent({
                                             children,
                                             isRtl,
                                             isStudioRoute,
                                             showHeaderSeparator = true
                                         }: {
    children: React.ReactNode;
    isRtl: boolean;
    isStudioRoute: boolean;
    showHeaderSeparator?: boolean;
}) {
    // For studio routes, render without sidebar
    if (isStudioRoute) {
        return (
            <div className="min-h-screen w-full">
                {children}
            </div>
        );
    }

    // For all other routes, render with sidebar
    return (
        <SidebarProvider isRtl={isRtl}>
            <AppSidebar />
            <SidebarInset className="overflow-hidden">
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className={`flex items-center gap-2 px-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <SidebarTrigger className={isRtl ? "-mr-1" : "-ml-1"} />
                        {showHeaderSeparator && (
                            <Separator
                                orientation="vertical"
                                className={`h-4 ${isRtl ? 'ml-2' : 'mr-2'}`}
                            />
                        )}
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-x-hidden w-full">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

export default async function LocaleLayout({
                                               children,
                                               params,
                                           }: {
    children: React.ReactNode;
    params: Promise<{locale: string; [key: string]: string | string[]}>;
}) {
    const resolvedParams = await params;
    const { locale } = resolvedParams;
    const isRtl = rtlLocales.includes(locale);

    // Get the current pathname from headers to check if it's a studio route
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || headersList.get('x-url') || '';

    // Alternative method using referer or request URL
    const referer = headersList.get('referer') || '';
    const currentPath = pathname || referer;

    // Check if current route is studio or any studio sub-route
    const isStudioRoute = currentPath.includes('/studio') ||
        (typeof resolvedParams.slug === 'string' && resolvedParams.slug === 'studio') ||
        (Array.isArray(resolvedParams.slug) && resolvedParams.slug.includes('studio'));

    // Providing all messages to the client
    const messages = await getMessages();

    const clerkLocalization = clerkLocalizationsMap[locale as keyof typeof clerkLocalizationsMap] || enGB;

    return (
        <html
            lang={locale}
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`${poppins.variable} ${lato.variable}`}
            suppressHydrationWarning
        >
        <head>
            <link rel="icon" href="/favicon.ico" />
        </head>
        <body
            className={cn(
                "min-h-screen bg-background font-sans antialiased overscroll-none overflow-x-hidden",
                poppins.variable,
                lato.variable
            )}
        >
        <ClerkProvider localization={clerkLocalization}>
            <NextIntlClientProvider messages={messages}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <ConditionalSidebarContent
                        isRtl={isRtl}
                        isStudioRoute={isStudioRoute}
                    >
                        {children}
                    </ConditionalSidebarContent>
                </ThemeProvider>
                <Toaster position="top-center" richColors />
            </NextIntlClientProvider>
        </ClerkProvider>
        </body>
        </html>
    );
}
