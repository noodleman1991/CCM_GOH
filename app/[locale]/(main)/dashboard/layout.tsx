import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
    Card,
    CardHeader,
    CardFooter,
    CardContent,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
    LucideUserPen,
    LucideWalletMinimal,
    LucideShieldUser,
    LucideCornerRightDown,
    LucideCornerUpRight,
    LucideLayoutDashboard,
    LucideArrowRight,
} from "lucide-react";

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
                        <div className="flex flex-col sm:flex-row gap-8">
                            <div className="flex-1 sm:flex-none">
                                <Card className="">
                                    <CardHeader>
                                        <div className="w-full flex items-center justify-start gap-3 truncate">
                                            <div className="flex-0">
                                                <div className="avatar" style={{ backgroundImage: `url(${clerkUser.imageUrl ?? '/pfimg.svg'})` }}></div>
                                            </div>
                                            <div className="flex flex-col truncate">
                                                <div className="text-base/4 font-medium text-neutral-600 dark:text-neutral-400 truncate">
                                                    {dbUser?.username ?? clerkUser.firstName ?? `User`}
                                                </div>
                                                <div className="text-xs/4 text-neutral-600 dark:text-neutral-400 truncate">
                                                    Personal settings
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ul>
                                            <li>
                                                <Link
                                                    href="/dashboard/profile/edit"
                                                    className="flex gap-2 justify-start items-center px-2 py-1 rounded bg-none hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                                                >
                                                    <LucideUserPen size={16} className="text-neutral-500" />
                                                    <span className="">Edit Profile</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    href="/dashboard/account"
                                                    className="flex gap-2 justify-start items-center px-2 py-1 rounded bg-none hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                                                >
                                                    <LucideWalletMinimal size={16} className="text-neutral-500" />
                                                    <span className="">Account & Security</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    href="/dashboard/profile/edit"
                                                    className="flex gap-2 justify-start items-center px-2 py-1 rounded bg-none hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                                                >
                                                    <LucideShieldUser size={16} className="text-neutral-500" />
                                                    <span className="">Privacy Settings</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    href="/settings/communities"
                                                    className="flex gap-2 justify-start items-center px-2 py-1 rounded bg-none hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                                                >
                                                    <LucideShieldUser size={16} className="text-neutral-500" />
                                                    <span className="">My Communities</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    href="/settings/import"
                                                    className="flex gap-2 justify-start items-center px-2 py-1 rounded bg-none hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                                                >
                                                    <LucideCornerRightDown size={16} className="text-neutral-500" />
                                                    <span className="">Import my bookmark</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    href="/settings/export"
                                                    className="flex gap-2 justify-start items-center px-2 py-1 rounded bg-none hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                                                >
                                                    <LucideCornerUpRight size={16} className="text-neutral-500" />
                                                    <span className="">Export my bookmark</span>
                                                </Link>
                                            </li>
                                        </ul>
                                    </CardContent>
                                    <CardFooter className="hidden sm:block">
                                        <Button className="w-full pointer-events-none">
                                            <LucideLayoutDashboard /> Support <LucideArrowRight />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                            <div className="flex-1">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
