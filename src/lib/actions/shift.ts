'use server'

import { shiftService } from '@/lib/services/shifts'
import { Shift, ShiftException } from '@/lib/types/shift'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/supabase/server'

export async function getShiftsByStaffIdAction(staffId: string) {
    await requireAuth()
    return await shiftService.getShiftsByStaffId(staffId)
}

export async function getShiftsByStoreIdAction(storeId: string) {
    await requireAuth()
    return await shiftService.getShiftsByStoreId(storeId)
}

export async function getShiftsByStaffAndStoreAction(staffId: string, storeId: string) {
    await requireAuth()
    return await shiftService.getShiftsByStaffAndStore(staffId, storeId)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveWeeklyShiftsAction(staffId: string, storeId: string, shifts: Omit<Shift, 'id'>[]) {
    try {
        await requireAuth()
        const result = await shiftService.saveWeeklyShifts(staffId, storeId, shifts)
        revalidatePath('/dashboard/stores/[id]')
        return { success: true as const, data: result }
    } catch (e: any) {
        console.error("FATAL ERROR IN SHIFT SAVE:", e)
        return { success: false as const, error: e.message || JSON.stringify(e) }
    }
}

// --- Shift Exceptions ---

export async function getShiftExceptionsByStoreIdAction(storeId: string, startDate?: string, endDate?: string) {
    await requireAuth()
    return await shiftService.getShiftExceptionsByStoreId(storeId, startDate, endDate)
}

export async function upsertShiftExceptionAction(exceptionConfig: Omit<ShiftException, 'id'>) {
    await requireAuth()
    const result = await shiftService.upsertShiftException(exceptionConfig)
    // Note: Revalidation occurs for dynamic paths, usually dashboard route is enough or the layout handles it
    revalidatePath('/dashboard/stores/[id]')
    return result
}

export async function deleteShiftExceptionAction(staffId: string, date: string) {
    await requireAuth()
    const result = await shiftService.deleteShiftException(staffId, date)
    revalidatePath('/dashboard/stores/[id]')
    return result
}
