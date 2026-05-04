/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { visitService } from '@/lib/services/visits'
import { revalidatePath } from 'next/cache'
import { VisitRecord } from '@/lib/types/visit-record'
import { requireAuth } from '@/lib/supabase/server'

export async function createVisitRecordAction(record: any) {
    await requireAuth()
    const result = await visitService.createVisitRecord(record)
    revalidatePath('/dashboard/customers') // Revalidate customers list/details
    // If we have a storeId param in global context we could be more specific
    return result
}

export async function getVisitRecordsAction(storeId: string, customerId: string) {
    await requireAuth()
    return await visitService.getVisitRecordsAndTagsByCustomerId(storeId, customerId)
}
