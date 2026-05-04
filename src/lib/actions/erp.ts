'use server'

import { expenseService, Expense } from '@/lib/services/expenses'
import { payoutService } from '@/lib/services/payouts'
import { regionService } from '@/lib/services/regions'
import { scriptService, tweetService } from '@/lib/services/marketing'
import { requireAuth } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ==================== Expenses ====================

export async function getExpensesAction(storeId: string, startDate?: string, endDate?: string) {
    await requireAuth()
    return await expenseService.getExpenses(storeId, startDate, endDate)
}

export async function getExpenseMonthlyTotalAction(storeId: string) {
    await requireAuth()
    return await expenseService.getMonthlyTotal(storeId)
}

export async function createExpenseAction(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) {
    await requireAuth()
    const result = await expenseService.createExpense(expense)
    revalidatePath('/dashboard/expenses')
    return result
}

export async function deleteExpenseAction(id: string) {
    await requireAuth()
    await expenseService.deleteExpense(id)
    revalidatePath('/dashboard/expenses')
}

// ==================== Payouts ====================

export async function getPayoutsAction(storeId: string, date?: string) {
    const { supabase } = await requireAuth()
    return await payoutService.getPayouts(storeId, date, supabase)
}

export async function calculatePayoutsAction(storeId: string, date: string) {
    const { supabase } = await requireAuth()
    
    // 1. Get staff for this store
    const { data: staffList } = await supabase.from('staff').select('id, name, back_margin_rate').eq('store_id', storeId)
    if (!staffList || staffList.length === 0) return await payoutService.getPayouts(storeId, date, supabase)
    
    // 2. Get bookings for this date (start_time within date)
    // Create Date objects to span the whole target day in UTC or local (assuming local date string 'yyyy-MM-dd')
    const startOfDay = new Date(`${date}T00:00:00+09:00`).toISOString()
    const endOfDay = new Date(`${date}T23:59:59+09:00`).toISOString()
    
    const { data: bookings } = await supabase
        .from('bookings')
        .select('staff_id, total_price, cast_back_amount, nomination_fee, status')
        .eq('store_id', storeId)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .in('status', ['completed', 'confirmed']) // count confirmed/completed
        
    // 3. Calculate and upsert
    for (const staff of staffList) {
        const staffBookings = bookings?.filter(b => b.staff_id === staff.id) || []
        
        let backAmount = 0
        for (const b of staffBookings) {
            // Simplified calculation: if cast_back_amount is set, use it. Otherwise use total_price * back_margin_rate
            if (b.cast_back_amount && b.cast_back_amount > 0) {
                backAmount += b.cast_back_amount
            } else {
                backAmount += b.total_price * ((staff.back_margin_rate || 0) / 100)
            }
            backAmount += (b.nomination_fee || 0)
        }
        
        // Lookup salary settings (guarantee) if exists
        const { data: salarySettings } = await supabase.from('staff_salary_settings').select('*').eq('staff_id', staff.id).maybeSingle()
        const guarantee = salarySettings?.guarantee_daily || 0
        const baseAmount = Math.max(guarantee - backAmount, 0) // Guarantee minus back amount? Usually guarantee is base, back is added. Or guarantee is minimum.
        // Simplified: baseAmount is just daily guarantee if backAmount is lower, but let's just make baseAmount = guarantee and backAmount = backAmount for now.
        // Actually, if it's a "guarantee" (保証), total should be max(guarantee, backAmount).
        const actualBase = backAmount < guarantee ? guarantee - backAmount : 0;
        
        const totalAmount = actualBase + backAmount
        
        // Skip if 0
        if (totalAmount === 0 && actualBase === 0) continue;
        
        await payoutService.upsertPayout({
            staff_id: staff.id,
            store_id: storeId,
            payout_date: date,
            base_amount: actualBase,
            back_amount: backAmount,
            deduction_amount: 0,
            deduction_reason: null,
            total_amount: totalAmount,
            is_paid: false
        }, supabase)
    }
    
    revalidatePath('/dashboard/guarantees')
    return await payoutService.getPayouts(storeId, date, supabase)
}

export async function markPayoutAsPaidAction(id: string) {
    const { supabase } = await requireAuth()
    await payoutService.markAsPaid(id, supabase)
    revalidatePath('/dashboard/guarantees')
}

export async function updatePayoutAction(id: string, updates: { base_amount?: number; back_amount?: number; deduction_amount?: number; deduction_reason?: string | null }) {
    const { supabase } = await requireAuth()
    
    // Automatically recalculate total_amount if any amounts are changed
    const currentPayoutQuery = await supabase.from('daily_payouts').select('*').eq('id', id).single()
    if (currentPayoutQuery.error) throw new Error('Payout not found')
    
    const currentPayout = currentPayoutQuery.data
    const newBase = updates.base_amount !== undefined ? updates.base_amount : currentPayout.base_amount
    const newBack = updates.back_amount !== undefined ? updates.back_amount : currentPayout.back_amount
    const newDeduction = updates.deduction_amount !== undefined ? updates.deduction_amount : currentPayout.deduction_amount
    
    const totalAmount = newBase + newBack - newDeduction
    
    const finalUpdates = {
        ...updates,
        total_amount: totalAmount
    }
    
    await payoutService.updatePayout(id, finalUpdates, supabase)
    revalidatePath('/dashboard/guarantees')
}

// ==================== Regions ====================

export async function getRegionsAction(organizationId: string) {
    await requireAuth()
    return await regionService.getRegions(organizationId)
}

export async function createRegionAction(organizationId: string, name: string, description?: string) {
    await requireAuth()
    const result = await regionService.createRegion(organizationId, name, description)
    revalidatePath('/dashboard/regions')
    return result
}

export async function deleteRegionAction(id: string) {
    await requireAuth()
    await regionService.deleteRegion(id)
    revalidatePath('/dashboard/regions')
}

// ==================== Scripts ====================

export async function getScriptsAction(storeId: string) {
    await requireAuth()
    return await scriptService.getScripts(storeId)
}

export async function createScriptAction(script: { store_id: string; title: string; content: string; category?: string | null }) {
    await requireAuth()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await scriptService.createScript(script as any)
    revalidatePath('/dashboard/scripts')
    return result
}

export async function deleteScriptAction(id: string) {
    await requireAuth()
    await scriptService.deleteScript(id)
    revalidatePath('/dashboard/scripts')
}

// ==================== Tweets ====================

export async function getTweetSchedulesAction(storeId: string) {
    await requireAuth()
    return await tweetService.getSchedules(storeId)
}

export async function createTweetScheduleAction(schedule: { store_id: string; staff_id?: string | null; content: string; scheduled_at: string; status: string }) {
    await requireAuth()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await tweetService.createSchedule(schedule as any)
    revalidatePath('/dashboard/tweets')
    return result
}

export async function deleteTweetScheduleAction(id: string) {
    await requireAuth()
    await tweetService.deleteSchedule(id)
    revalidatePath('/dashboard/tweets')
}
