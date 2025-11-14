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
    const dbUser = await prisma.user.findUnique({
        where: { id: userId }
    });

    // If user exists in Clerk but not in Prisma, create them
    if (!dbUser) {
        try {
            console.log(`🔄 Creating missing user ${userId} in database`)
            await prisma.user.create({
                data: {
                    id: userId,
                    email: clerkUser.emailAddresses[0]?.emailAddress || null,
                    firstName: clerkUser.firstName,
                    lastName: clerkUser.lastName,
                    username: clerkUser.username,
                    image: clerkUser.imageUrl,
                    emailVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified' 
                        ? new Date() 
                        : null,
                    phoneNumber: clerkUser.phoneNumbers[0]?.phoneNumber || null,
                    phoneVerified: clerkUser.phoneNumbers[0]?.verification?.status === 'verified' 
                        ? new Date() 
                        : null,
                    // Initialize with default values
                    workTypes: [],
                    expertiseAreas: [],
                    isSearchable: true,
                    profileVisibility: 'PUBLIC',
                    showEmail: false,
                    showPhoneNumber: false,
                    showWorkDetails: true,
                    showSocialLinks: true,
                    showLocation: true,
                }
            })
            console.log(`✅ Successfully created user ${userId} in database`)
        } catch (error) {
            console.error(`❌ Failed to create user ${userId}:`, error)
            redirect("/sign-in");
        }
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
