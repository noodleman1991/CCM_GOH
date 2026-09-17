import { redirect } from 'next/navigation';
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ensureUserRow } from "@/lib/user-bootstrap";

export default async function SettingsLayout({
                                                 children,
                                             }: Readonly<{
    children: React.ReactNode;
}>) {
    // Get Clerk authentication data
    const { userId } = await auth();

    // Redirect if not authenticated
    if (!userId) {
        redirect("/sign-in");
    }

    // Get Clerk user data
    const clerkUser = await currentUser();

    if (!clerkUser) {
        redirect("/sign-in");
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
        if (!dbUser) redirect("/onboarding")
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
