import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
    // We need an admin client to bypass RLS in the background webhook
    let supabaseAdmin;
    try {
        supabaseAdmin = getAdminClient()
    } catch (e) {
        console.error('Failed to initialize admin client:', e)
        return NextResponse.json({ message: 'Server configuration error' }, { status: 500 })
    }

    const rawBody = await req.text()
    const signature = req.headers.get('stripe-signature') as string

    // In local dev without webhook secret, or before setup, we can optionally bypass verification with a warning.
    // However, it is highly recommended to ALWAYS verify in production.
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event;

    try {
        if (!webhookSecret) {
            // In production, signature verification is MANDATORY
            if (process.env.NODE_ENV === 'production') {
                console.error('❌ STRIPE_WEBHOOK_SECRET is not set in production. Rejecting webhook.')
                return NextResponse.json({ message: 'Webhook secret not configured' }, { status: 500 })
            }
            console.warn('⚠️ STRIPE_WEBHOOK_SECRET is not set. Bypassing signature verification (DEV ONLY).')
            event = JSON.parse(rawBody)
        } else {
            event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
        }
    } catch (err: unknown) {
        console.error(`⚠️ Webhook signature verification failed:`, err instanceof Error ? err.message : err)
        return NextResponse.json({ message: 'Webhook error' }, { status: 400 })
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as { metadata?: { bookingId?: string } }

        // Retrieve the bookingId we stored in metadata
        const bookingId = session.metadata?.bookingId

        if (bookingId) {
            console.log(`✅ Payment received for booking: ${bookingId}`)

            // Update Supabase booking status
            const { error } = await supabaseAdmin
                .from('bookings')
                // @ts-expect-error: bypassing stale supabase types
                .update({
                    payment_status: 'paid',
                    status: 'confirmed'
                } as any)
                .eq('id', bookingId)

            if (error) {
                console.error(`❌ Failed to update booking ${bookingId} in Supabase:`, error.message)
                return NextResponse.json({ message: 'Failed to update database' }, { status: 500 })
            }
        }
    }

    return NextResponse.json({ received: true })
}
