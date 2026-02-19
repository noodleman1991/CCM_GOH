import { redirect } from 'next/navigation';
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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

    // If user not found, webhook may still be processing - wait and retry
    if (!dbUser) {
        console.log(`⏳ User ${userId} not found in database - webhook may be processing. Waiting 3s...`)

        // Wait for webhook to complete (3s accounts for Vercel cold starts + DB latency)
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Retry fetch
        dbUser = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!dbUser) {
            // Webhook still hasn't created user - redirect to onboarding
            // Onboarding's upsert will create user as fallback
            console.log(`⚠️ User ${userId} still not found after retry - redirecting to onboarding`)
            redirect("/onboarding")
        }

        console.log(`✅ User ${userId} found after retry`)
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
