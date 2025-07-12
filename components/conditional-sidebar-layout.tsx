// components/conditional-sidebar-layout.tsx
"use client";

import { usePathname } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface ConditionalSidebarLayoutProps {
    children: React.ReactNode;
    isRtl: boolean;
    showHeaderSeparator?: boolean;
}

export default function ConditionalSidebarLayout({
                                                     children,
                                                     isRtl,
                                                     showHeaderSeparator = true
                                                 }: ConditionalSidebarLayoutProps) {
    const pathname = usePathname();

    // Check if current route is studio or any studio sub-route
    const isStudioRoute = pathname.includes('/studio');

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
        <SidebarProvider>
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
