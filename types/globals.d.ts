export {}

export type Roles = 'admin' | 'editor' | 'community-editor' | 'member'

declare global {
    interface CustomJwtSessionClaims {
        metadata: {
            onboardingComplete?: boolean
            role?: Roles
        }
    }
}
