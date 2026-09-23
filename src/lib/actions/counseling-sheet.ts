'use server'

import { revalidatePath } from 'next/cache'
import {
    counselingSheetSchema,
    counselingStaffNotesSchema,
    type CounselingSheet,
    type CounselingSheetInput,
    type CounselingStaffNotes,
} from '@/lib/counseling-sheet'
import { requireAuth } from '@/lib/supabase/server'

async function getStaffContext(customerId: string) {
    const { user, supabase } = await requireAuth()
    const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, store_id, name, phone')
        .eq('id', customerId)
        .single()

    if (customerError || !customer) throw new Error('顧客が見つかりません。')

    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('organization_id')
        .eq('id', customer.store_id)
        .single()

    if (storeError || !store) throw new Error('店舗が見つかりません。')

    const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', store.organization_id)
        .eq('user_id', user.id)
        .maybeSingle()

    if (membershipError || !membership) throw new Error('この顧客のカウンセリングシートを閲覧する権限がありません。')
    return { user, supabase, customer }
}

async function getPatientContext(customerId: string) {
    const { user, supabase } = await requireAuth()
    const { data: customer, error } = await supabase
        .from('customers')
        .select('id, store_id, name, phone')
        .eq('id', customerId)
        .eq('auth_user_id', user.id)
        .single()

    if (error || !customer) throw new Error('このカウンセリングシートを入力する権限がありません。')
    return { user, supabase, customer }
}

export async function getMyCounselingCustomersAction() {
    const { user, supabase } = await requireAuth()
    const { data, error } = await supabase
        .from('customers')
        .select('id, name, store_id')
        .eq('auth_user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) throw new Error('カウンセリングシートの対象を読み込めませんでした。')
    return data ?? []
}

export async function getMyCounselingCustomerAction(customerId: string) {
    const { customer } = await getPatientContext(customerId)
    return customer
}

export async function getStaffCounselingCustomerAction(customerId: string) {
    const { customer } = await getStaffContext(customerId)
    return customer
}

function mapSheet(row: {
    id: string
    customer_id: string
    consultation_date: string
    answers: unknown
    marks: unknown
    created_at: string
    updated_at: string
}): CounselingSheet {
    return {
        id: row.id,
        customerId: row.customer_id,
        consultationDate: row.consultation_date,
        answers: row.answers as Record<string, string>,
        marks: row.marks as CounselingSheet['marks'],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}

export async function getMyCounselingSheetsAction(customerId: string): Promise<CounselingSheet[]> {
    const { supabase } = await getPatientContext(customerId)
    const { data, error } = await supabase
        .from('counseling_sheets')
        .select('id, customer_id, consultation_date, answers, marks, created_at, updated_at')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

    if (error) throw new Error('シートを読み込めませんでした。DBのマイグレーションを確認してください。')
    return (data ?? []).map(mapSheet)
}

export async function getStaffCounselingSheetsAction(customerId: string): Promise<CounselingSheet[]> {
    const { supabase, customer } = await getStaffContext(customerId)
    const { data: sheets, error } = await supabase
        .from('counseling_sheets')
        .select('id, customer_id, consultation_date, answers, marks, created_at, updated_at')
        .eq('store_id', customer.store_id)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

    if (error) throw new Error('シートを読み込めませんでした。DBのマイグレーションを確認してください。')
    if (!sheets?.length) return []

    const { data: notes, error: notesError } = await supabase
        .from('counseling_staff_notes')
        .select('sheet_id, answers, marks, updated_at')
        .in('sheet_id', sheets.map(sheet => sheet.id))

    if (notesError) throw new Error('スタッフの追記を読み込めませんでした。')
    const notesBySheet = new Map((notes ?? []).map(note => [note.sheet_id, {
        answers: note.answers as Record<string, string>,
        marks: note.marks as CounselingStaffNotes['marks'],
        updatedAt: note.updated_at,
    }]))
    return sheets.map(row => ({ ...mapSheet(row), staffNotes: notesBySheet.get(row.id) ?? null }))
}

export async function submitMyCounselingSheetAction(customerId: string, input: CounselingSheetInput) {
    const parsed = counselingSheetSchema.safeParse(input)
    if (!parsed.success) throw new Error('入力内容を確認してください。')
    const { supabase, user, customer } = await getPatientContext(customerId)

    const { data, error } = await supabase
        .from('counseling_sheets')
        .insert({
            store_id: customer.store_id,
            customer_id: customer.id,
            consultation_date: parsed.data.consultationDate,
            answers: parsed.data.answers,
            marks: parsed.data.marks,
            created_by: user.id,
        })
        .select('id')
        .single()

    if (error || !data) throw new Error('シートを保存できませんでした。')
    revalidatePath(`/mypage/counseling/${customerId}`)
    revalidatePath(`/dashboard/customers/${customerId}/counseling`)
    return data.id as string
}

export async function saveStaffCounselingNotesAction(
    customerId: string,
    sheetId: string,
    input: Pick<CounselingStaffNotes, 'answers' | 'marks'>,
) {
    const parsed = counselingStaffNotesSchema.safeParse(input)
    if (!parsed.success) throw new Error('入力内容を確認してください。')
    const { supabase, user, customer } = await getStaffContext(customerId)

    const { data: sheet, error: sheetError } = await supabase
        .from('counseling_sheets')
        .select('id')
        .eq('id', sheetId)
        .eq('customer_id', customer.id)
        .eq('store_id', customer.store_id)
        .single()

    if (sheetError || !sheet) throw new Error('シートが見つかりません。')

    const { data: existing, error: existingError } = await supabase
        .from('counseling_staff_notes')
        .select('sheet_id')
        .eq('sheet_id', sheet.id)
        .maybeSingle()

    if (existingError) throw new Error('スタッフの追記を確認できませんでした。')

    const values = {
        answers: parsed.data.answers,
        marks: parsed.data.marks,
        updated_by: user.id,
    }
    const { error } = existing
        ? await supabase.from('counseling_staff_notes').update(values).eq('sheet_id', sheet.id)
        : await supabase.from('counseling_staff_notes').insert({ sheet_id: sheet.id, ...values })

    if (error) throw new Error('スタッフの追記を保存できませんでした。')
    revalidatePath(`/dashboard/customers/${customerId}/counseling`)
}
