/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { bookingService } from '@/lib/services/bookings'
import { revalidatePath, unstable_noStore } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/supabase/server'

export async function getAvailableTimeSlotsAction(
    storeId: string,
    date: Date,
    durationMinutes: number,
    staffId?: string,
    bufferBefore: number = 0,
    bufferAfter: number = 0
) {
    unstable_noStore();
    const supabase = await createClient()
    return await bookingService.getAvailableTimeSlots(storeId, date, durationMinutes, staffId, bufferBefore, bufferAfter, supabase)
}

export async function getWeeklyAvailabilityAction(
    storeId: string,
    startDate: Date,
    durationMinutes: number = 30,
    staffId?: string,
    bufferBefore: number = 0,
    bufferAfter: number = 0
) {
    unstable_noStore();
    const supabase = await createClient()
    return await bookingService.getWeeklyAvailability(storeId, startDate, durationMinutes, staffId, bufferBefore, bufferAfter, 7, supabase)
}

export async function createBookingAction(payload: any) {
    const supabase = await createClient()

    let realCustomerId = null

    // 1. Try to link to an existing customer via auth_user_id
    if (payload.auth_user_id) {
        const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('store_id', payload.store_id)
            .eq('auth_user_id', payload.auth_user_id)
            .single()

        if (existingCustomer) realCustomerId = existingCustomer.id
    }

    // 2. Try to link via email if not logged in
    if (!realCustomerId && payload.customer_email) {
        const { data: existingCustomerEmail } = await supabase
            .from('customers')
            .select('id')
            .eq('store_id', payload.store_id)
            .eq('email', payload.customer_email)
            .single()

        if (existingCustomerEmail) realCustomerId = existingCustomerEmail.id
    }

    // 3. Create a new CRM customer record if none exist
    if (!realCustomerId) {
        const { data: newCustomer, error: createCustError } = await supabase
            .from('customers')
            .insert([{
                store_id: payload.store_id,
                name: payload.customer_name,
                email: payload.customer_email || null,
                phone: payload.customer_phone || null,
                auth_user_id: payload.auth_user_id || null
            }])
            .select('id')
            .single()

        if (!createCustError && newCustomer) {
            realCustomerId = newCustomer.id
        } else {
            console.error("Failed to create customer record:", createCustError)
        }
    }

    // 4. Calculate detailed pricing breakdown (Course, Options, Nomination)
    let courseAmount = 0
    let optionsAmount = 0
    let nominationFee = 0
    let backMarginRate = 0
    let castBackAmount = 0

    // Fetch Service Price
    if (payload.service_id) {
        const { data: service } = await supabase
            .from('services')
            .select('price')
            .eq('id', payload.service_id)
            .single()
        if (service) courseAmount = service.price || 0
    }

    // Fetch Staff Margin and Nomination Fee
    if (payload.staff_id) {
        const { data: staff } = await supabase
            .from('staff')
            .select('back_margin_rate, nomination_fee')
            .eq('id', payload.staff_id)
            .single()
        if (staff) {
            backMarginRate = staff.back_margin_rate || 0
            nominationFee = staff.nomination_fee || 0
        }
    }

    // Fetch Option Prices
    if (payload.options && Array.isArray(payload.options) && payload.options.length > 0) {
        const { data: optionsData } = await supabase
            .from('service_options')
            .select('id, price')
            .in('id', payload.options)
        
        if (optionsData) {
            optionsAmount = optionsData.reduce((acc, opt) => acc + (opt.price || 0), 0)
        }
    }

    // Calculate total cast back amount based on Total Price (Course + Options + Nomination)
    // Alternatively, it might only apply to the course amount. Typical esthetics systems apply it to the total (excluding tax? assuming tax-inc here).
    const calculatedTotal = courseAmount + optionsAmount + nominationFee
    
    // Use the payload total if provided, otherwise fallback to calculated
    const finalTotal = payload.total_price || calculatedTotal
    
    // Calculate cast back
    castBackAmount = Math.floor(finalTotal * (backMarginRate / 100))

    // 5. Create the Booking linked to the real customer ID
    const bookingToCreate = {
        store_id: payload.store_id,
        service_id: payload.service_id,
        staff_id: payload.staff_id,
        customer_id: realCustomerId,
        customer_name: payload.customer_name,
        options: payload.options,
        total_price: finalTotal,
        payment_status: payload.payment_status,
        payment_method: payload.payment_method,
        start_time: payload.start_time,
        end_time: payload.end_time,
        status: payload.status || 'confirmed',
        buffer_minutes_before: payload.buffer_minutes_before || 0,
        buffer_minutes_after: payload.buffer_minutes_after || 0,
        course_amount: courseAmount,
        options_amount: optionsAmount,
        nomination_fee: nominationFee,
        cast_back_amount: castBackAmount
    }

    const result = await bookingService.createBooking(bookingToCreate as any, supabase)
    revalidatePath(`/dashboard/bookings`)
    return result
}

export async function updateStatusAction(id: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') {
    await requireAuth()
    await bookingService.updateStatus(id, status)
    revalidatePath(`/dashboard/bookings`)
}

export async function getBookingsByCustomerIdAction(customerId: string) {
    return await bookingService.getBookingsByCustomerId(customerId)
}

export async function getBookingsByAuthUserIdAction(authUserId: string) {
    return await bookingService.getBookingsByAuthUserId(authUserId)
}

export async function cancelBookingAction(bookingId: string) {
    const booking = await bookingService.getBookingById(bookingId)

    if (!booking) {
        throw new Error('予約が見つかりません')
    }

    // 24 hours before check
    const startTime = new Date(booking.start_time)
    const now = new Date()
    const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffHours < 24) {
        throw new Error('キャンセル期限(24時間前)を過ぎています。直接店舗へお問い合わせください。')
    }

    await bookingService.updateStatus(bookingId, 'cancelled')

    revalidatePath('/mypage')
    revalidatePath(`/dashboard/bookings`)
    return { success: true }
}

export async function updateBookingAction(id: string, updates: any) {
    await requireAuth()
    const result = await bookingService.updateBooking(id, updates)
    revalidatePath(`/dashboard/bookings`)
    return result
}

export async function deleteBookingAction(id: string) {
    const { supabase } = await requireAuth()
    await bookingService.deleteBooking(id, supabase)
    revalidatePath(`/dashboard/bookings`)
}
