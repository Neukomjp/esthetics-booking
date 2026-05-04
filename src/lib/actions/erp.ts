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
    await requireAuth()
    return await payoutService.getPayouts(storeId, date)
}

export async function markPayoutAsPaidAction(id: string) {
    await requireAuth()
    await payoutService.markAsPaid(id)
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
