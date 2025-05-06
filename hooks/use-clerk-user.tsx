"use client";

import { useUser } from '@clerk/nextjs';
import { useCallback } from 'react';

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

        return {
            name: user.fullName || user.username || "User",
            email: user.primaryEmailAddress?.emailAddress || "",
            avatar: user.imageUrl || "/avatars/default.jpg",
        };
    }, [user, isSignedIn, isLoaded]);

    return {
        userData: getUserData(),
        isSignedIn,
        isLoaded
    };
}
