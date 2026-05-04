import { createClient } from '@/lib/supabase/client'

export type DailyPayout = {
    id: string
    staff_id: string
    store_id: string
    payout_date: string
    base_amount: number
    back_amount: number
    deduction_amount: number
    deduction_reason: string | null
    total_amount: number
    is_paid: boolean
    created_at: string
    updated_at: string
    // Joined
    staff?: { name: string }
}

export const payoutService = {
    async getPayouts(storeId: string, date?: string) {
        const supabase = createClient()
        let query = supabase
            .from('daily_payouts')
            .select('*, staff:staff_id(name)')
            .eq('store_id', storeId)
            .order('payout_date', { ascending: false })

        if (date) query = query.eq('payout_date', date)

        const { data, error } = await query
        if (error) throw new Error(error.message)
        return (data || []) as DailyPayout[]
    },

    async upsertPayout(payout: Omit<DailyPayout, 'id' | 'created_at' | 'updated_at' | 'staff'>) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('daily_payouts')
            .upsert([payout], { onConflict: 'staff_id,payout_date' })
            .select('*, staff:staff_id(name)')
            .single()

        if (error) throw new Error(error.message)
        return data as DailyPayout
    },

    async markAsPaid(id: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('daily_payouts')
            .update({ is_paid: true })
            .eq('id', id)

        if (error) throw new Error(error.message)
    }
}
