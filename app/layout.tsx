import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";

import { NextIntlClientProvider, hasLocale } from 'next-intl';
// import { notFound } from 'next/navigation';
// import { routing } from '@/i18n/routing';
import { rtlLocales } from '@/i18n/routing';

interface RootLayoutProps {
    children: React.ReactNode;
    showHeaderSeparator?: boolean;
}

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
    title: {
        template: "%s | Schema UI Starter",
        default: "Sanity Next.js Website | Schema UI Starter",
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

const fontSans = FontSans({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-sans",
});

export default async function LocaleLayout({
                                       children, params,
                                   }: {
    children: React.ReactNode;
    params: Promise<{locale: string}>;
}) {
    const {locale} = await params;
    const isRtl = rtlLocales.includes(locale);
    // if (!hasLocale(routing.locales, locale)) {
    //     notFound();
    // }
    return (
        <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
        <link rel="icon" href="/favicon.ico" />
        <body
            className={cn(
                "min-h-screen bg-background font-sans antialiased overscroll-none overflow-x-hidden",
                fontSans.variable
            )}
        >
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="overflow-hidden">
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                        </div>
                    </header>
                        {/*<NextIntlClientProvider>{children}</NextIntlClientProvider>*/}
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-x-hidden w-full">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </ThemeProvider>
        <Toaster position="top-center" richColors />
        </body>
        </html>
    );
}
