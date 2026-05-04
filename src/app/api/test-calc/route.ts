import { NextResponse } from 'next/server'
import { calculatePayoutsAction } from '@/lib/actions/erp'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || '2026-05-05'

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Not authenticated' })

        // Get organization
        let orgId = (await cookies()).get('organization-id')?.value
        if (!orgId) {
            const { data: orgMembers } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', user.id)
                .limit(1)
            orgId = orgMembers?.[0]?.organization_id
        }

        // Get store
        const { data: stores } = await supabase
            .from('stores')
            .select('id')
            .eq('organization_id', orgId)
            .limit(1)
        const storeId = stores?.[0]?.id

        if (!storeId) return NextResponse.json({ error: 'Store not found' })

        // Try calculate
        const result = await calculatePayoutsAction(storeId, date)
        return NextResponse.json({ success: true, result })
    } catch (error: any) {
        console.error('Calculation error:', error)
        return NextResponse.json({ success: false, error: error.message, stack: error.stack })
    }
}
