'use server'

import { couponService } from '@/lib/services/coupons'
import { Coupon } from '@/lib/types/coupon'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/supabase/server'

export async function getCouponsAction(storeId: string) {
    await requireAuth()
    return await couponService.getCoupons(storeId)
}

export async function createCouponAction(data: Omit<Coupon, 'id' | 'created_at'>) {
    await requireAuth()
    const result = await couponService.createCoupon(data)
    revalidatePath('/dashboard/coupons')
    return result
}

export async function toggleCouponStatusAction(id: string) {
    await requireAuth()
    const result = await couponService.toggleCouponStatus(id)
    revalidatePath('/dashboard/coupons')
    return result
}

export async function validateCouponAction(storeId: string, code: string) {
    // NOTE: This remains public - customers need to validate coupons during booking
    return await couponService.getCouponByCode(storeId, code)
}
