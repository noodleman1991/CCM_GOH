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
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

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

    // If user exists in Clerk but not in Prisma, redirect to onboarding
    if (!dbUser) {
        // This is where you'd create the user in your DB or redirect to onboarding
        redirect("/complete-profile");
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
                                                    {dbUser.username ?? clerkUser.firstName ?? `User`}
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
                                                    href="/settings/profile"
                                                    className="flex gap-2 justify-start items-center px-2 py-1 rounded bg-none hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                                                >
                                                    <LucideUserPen size={16} className="text-neutral-500" />
                                                    <span className="">Profile</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    href="/settings/account"
                                                    className="flex gap-2 justify-start items-center px-2 py-1 rounded bg-none hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                                                >
                                                    <LucideWalletMinimal size={16} className="text-neutral-500" />
                                                    <span className="">Account</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    href="/settings/security"
                                                    className="flex gap-2 justify-start items-center px-2 py-1 rounded bg-none hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                                                >
                                                    <LucideShieldUser size={16} className="text-neutral-500" />
                                                    <span className="">Security</span>
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
