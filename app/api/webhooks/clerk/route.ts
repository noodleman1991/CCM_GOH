// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { userSync } from '@/lib/user-sync'

export async function POST(req: Request) {
    try {
        // Verify webhook
        const headerPayload = await headers()
        const svixId = headerPayload.get("svix-id")
        const svixTimestamp = headerPayload.get("svix-timestamp")
        const svixSignature = headerPayload.get("svix-signature")

        if (!svixId || !svixTimestamp || !svixSignature) {
            return NextResponse.json({ error: 'Missing headers' }, { status: 400 })
        }

        const payload = await req.text()
        const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)

        let evt
        try {
            evt = wh.verify(payload, {
                "svix-id": svixId,
                "svix-timestamp": svixTimestamp,
                "svix-signature": svixSignature,
            }) as any
        } catch (err) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const { type, data } = evt
        const userId = data.id

        // Handle events
        let result
        let action = 'processed'

        switch (type) {
            case 'user.created':
            case 'user.updated':
                result = await userSync.syncFromClerk(userId)
                action = result.action || (type === 'user.created' ? 'created' : 'updated')
                break

            case 'user.deleted':
                result = await userSync.deleteUser(userId)
                action = 'deleted'
                break

            default:
                return NextResponse.json({ success: true, action: 'ignored' })
        }

        if (!result.success) {
            console.error(`Webhook failed for ${type}:`, userId)
            return NextResponse.json({ error: 'Sync failed' }, { status: 503 })
        }

        return NextResponse.json({ success: true, action })

    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({ status: 'healthy' })
}
