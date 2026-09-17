import { redirect } from '@/i18n/navigation';
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ensureUserRow } from "@/lib/user-bootstrap";
import { getLocale } from "next-intl/server";

export default async function SettingsLayout({
                                                 children,
                                             }: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocale();
    // Get Clerk authentication data
    const { userId } = await auth();

    // Redirect if not authenticated
    if (!userId) {
        redirect({ href: "/sign-in", locale });
    }

    // Get Clerk user data
    const clerkUser = await currentUser();

    if (!clerkUser) {
        redirect({ href: "/sign-in", locale });
    }

    // Get extended user data from Prisma
    let dbUser = await prisma.user.findUnique({
        where: { id: userId }
    });

    // The webhook that writes the row can lag a first sign-in; create it
    // from Clerk now instead of sleeping in the render (lib/user-bootstrap.ts).
    if (!dbUser) {
        await ensureUserRow(userId)
        dbUser = await prisma.user.findUnique({ where: { id: userId } })
        if (!dbUser) redirect({ href: "/onboarding", locale })
    }

    return (
        <>
            <main>
                <div className="section">
                    <div className="my-5">
                        {children}
                    </div>
                </div>
            </main>
        </>
    );
}
