"use client";

import { useUser } from '@clerk/nextjs';
import { useCallback } from 'react';
import { getOptimizedClerkImageUrl } from '@/lib/image-utils';

export interface UserData {
    name: string;
    email: string;
    avatar: string;
}

export function useClerkUser() {
    const { user, isSignedIn, isLoaded } = useUser();

    const getUserData = useCallback((): UserData => {
        if (!isLoaded || !isSignedIn || !user) {
            return {
                name: "Guest User",
                email: "guest@example.com",
                avatar: "/avatars/default.jpg",
            };
        }

        // Use optimized Clerk image URL
        const optimizedAvatar = getOptimizedClerkImageUrl(user.imageUrl, {
            width: 200,
            height: 200,
            fit: 'crop',
            quality: 85
        });

        return {
            name: user.fullName || user.username || "User",
            email: user.primaryEmailAddress?.emailAddress || "",
            avatar: optimizedAvatar || "/avatars/default.jpg",
        };
    }, [user, isSignedIn, isLoaded]);

    return {
        userData: getUserData(),
        isSignedIn,
        isLoaded
    };
}
