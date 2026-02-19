import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from '@/generated/prisma';
import { getTranslations } from 'next-intl/server';
import { getLocale } from 'next-intl/server';
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const { userId } = await auth();
    const locale = await getLocale();
    const t = await getTranslations('api.user');

    if (!userId) {
        return NextResponse.json(
            { error: t('errors.unauthorized') },
            { status: 401 }
        );
    }

    try {
        // First find the DB user that matches the Clerk userId
        const dbUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!dbUser) {
            return NextResponse.json(
                { error: t('errors.userNotFound') },
                { status: 404 }
            );
        }
        const qs = request?.nextUrl?.search?.slice(1) ?? '';

        let fields = null;
        switch (qs) {
            case 'profile':
                fields = {
                    firstName: true,
                    lastName: true,
                    email: true,
                    bio: true,
                    image: true,
                };
                break;
            case 'username':
                fields = {
                    username: true,
                };
                break;
            case 'provider':
                fields = {
                    id: true,
                    email: true,
                    accounts: {
                        select: {
                            type: true,
                            provider: true,
                            createdAt: true,
                        },
                    },
                };
                break;
            // case 'security': //todo: understand in context
            //     fields = {
            //         id: true,
            //         password: true,
            //     };
            //     break;
            case 'role':
                fields = {
                    role: true,
                };
                break;
            case 'communities':
                fields = {
                    communityMemberships: {
                        select: {
                            role: true,
                            community: {
                                select: {
                                    id: true,
                                    name: true,
                                    type: true,
                                    regionalName: true,
                                    specialName: true,
                                    description: true,
                                }
                            }
                        }
                    }
                };
                break;
        }

        const data = await prisma.user.findUnique({
            select: fields,
            where: {
                id: userId,
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        if (qs && data) {
            // empty string instead of null
            for (const [key, value] of Object.entries(data)) {
                data[key] = value === null ? '' : value;
            }
        }

        return NextResponse.json(
            data,
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: t('errors.serverError') },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const { userId } = await auth();
    const locale = await getLocale();
    const t = await getTranslations('api.user');

    if (!userId) {
        return NextResponse.json(
            { error: t('errors.unauthorized') },
            { status: 401 }
        );
    }

    try {
        // First find the DB user that matches the Clerk userId
        const dbUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!dbUser) {
            return NextResponse.json(
                { error: t('errors.userNotFound') },
                { status: 404 }
            );
        }
        const req = await request.json();
        const qs = request?.nextUrl?.search?.slice(1);

        if (qs === 'profile') {
            if (!req?.firstName || !req?.lastName) {
                return NextResponse.json(
                    { error: t('errors.nameRequired') },
                    { status: 400 }
                );
            }
            await prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    firstName: req?.name || null,
                    lastName: req?.name || null,
                    bio: req?.bio || null,
                    image: req?.image || null,
                },
            });
            return NextResponse.json(
                { message: t('success.profileUpdated') },
                { status: 200 }
            );
        }

        if (qs === 'username') {
            if (req?.username) {
                const avoid = [
                    'admin', 'administrator',
                    'app', 'cms', 'auth', 'api', 'settings',
                    'profile', 'system', 'operator', 'manager',
                    'keep',
                ];
                if (avoid.includes(req?.username)) {
                    return NextResponse.json(
                        { error: t('errors.usernameReserved') },
                        { status: 400 }
                    );
                }
                const count = await prisma.user.count({
                    where: {
                        username: req?.username,
                        NOT: {
                            id: userId,
                        },
                    },
                });
                if (count > 0) {
                    return NextResponse.json(
                        { error: t('errors.usernameInUse') },
                        { status: 400 }
                    );
                }
            }
            await prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    username: req?.username || null,
                },
            });
            return NextResponse.json(
                { message: t('success.usernameUpdated') },
                { status: 200 }
            );
        }

        if (qs === 'remove-username') {
            await prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    username: null,
                },
            });
            return NextResponse.json(
                { message: t('success.usernameRemoved') },
                { status: 200 }
            );
        }

        if (qs === 'join-community') {
            // Validate community ID
            if (!req?.communityId) {
                return NextResponse.json(
                    { error: t('errors.communityIdRequired') },
                    { status: 400 }
                );
            }

            // Check if community exists
            const community = await prisma.community.findUnique({
                where: {
                    id: req.communityId
                }
            });

            if (!community) {
                return NextResponse.json(
                    { error: t('errors.communityNotFound') },
                    { status: 404 }
                );
            }

            // Create or update community membership
            await prisma.userCommunity.upsert({
                where: {
                    userId_communityId: {
                        userId: userId,
                        communityId: req.communityId
                    }
                },
                update: {}, // No updates needed if already exists
                create: {
                    userId: userId,
                    communityId: req.communityId,
                    role: 'community_member' // Default role when joining
                }
            });

            return NextResponse.json(
                { message: t('success.communityJoined') },
                { status: 200 }
            );
        }

        if (qs === 'leave-community') {
            if (!req?.communityId) {
                return NextResponse.json(
                    { error: t('errors.communityIdRequired') },
                    { status: 400 }
                );
            }

            await prisma.userCommunity.delete({
                where: {
                    userId_communityId: {
                        userId: userId,
                        communityId: req.communityId
                    }
                }
            });

            return NextResponse.json(
                { message: t('success.communityLeft') },
                { status: 200 }
            );
        }

        // if (qs === 'security') { //todo: understand in context
        //     // Add password update logic here if needed
        //     if (req?.password) {
        //         // You would hash the password here
        //         await prisma.user.update({
        //             where: {
        //                 id: userId,
        //             },
        //             data: {
        //                 password: req.password, // In reality, you'd hash this
        //             },
        //         });
        //
        //         return NextResponse.json(
        //             { message: t('success.passwordUpdated') },
        //             { status: 200 }
        //         );
        //     }
        // }

        return NextResponse.json(
            { error: t('errors.updateFailed') },
            { status: 500 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: t('errors.serverError') },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    const { userId } = await auth();
    const locale = await getLocale();
    const t = await getTranslations('api.user');

    if (!userId) {
        return NextResponse.json(
            { error: t('errors.unauthorized') },
            { status: 401 }
        );
    }

    try {
        // First find the DB user that matches the Clerk userId
        const dbUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!dbUser) {
            return NextResponse.json(
                { error: t('errors.userNotFound') },
                { status: 404 }
            );
        }
        const qs = request?.nextUrl?.search?.slice(1);

        // Delete specific community membership
        if (qs?.startsWith('community-')) {
            const communityId = qs.replace('community-', '');

            await prisma.userCommunity.delete({
                where: {
                    userId_communityId: {
                        userId: userId,
                        communityId: communityId
                    }
                }
            });

            return NextResponse.json(
                { message: t('success.communityRemoved') },
                { status: 200 }
            );
        }

        // Delete entire account
        await prisma.user.delete({
            where: {
                id: userId,
            },
        });
        return NextResponse.json(
            { message: t('success.accountDeleted') },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: error },
            { status: 500 }
        );
    }
}
