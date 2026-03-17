import { createClient } from '@/lib/supabase/client'
import { Staff } from '@/types/staff'

export const staffService = {
    async getStaffByStoreId(storeId: string, supabaseClient?: any) {
        try {
            const supabase = supabaseClient || createClient()
            // Note: Use inner join with store_staff to get staff for this store
            const { data, error } = await supabase
                .from('staff')
                .select(`
                    *,
                    store_staff!inner ( store_id )
                `)
                .eq('store_staff.store_id', storeId)

            if (error) throw new Error(error.message)

            const staffIds = data ? data.map((s: any) => s.id) : []
            let storeStaffMapping: any[] = []
            
            if (staffIds.length > 0) {
               const { data: mapping } = await supabase
                   .from('store_staff')
                   .select('staff_id, store_id')
                   .in('staff_id', staffIds)
               storeStaffMapping = mapping || []
            }

            return (data || []).map((s: any) => ({
                id: s.id,
                storeId: s.store_id,
                storeIds: storeStaffMapping.filter((m: any) => m.staff_id === s.id).map((m: any) => m.store_id),
                name: s.name,
                role: s.role,
                bio: s.bio,
                avatarUrl: s.avatar_url,
                specialties: s.specialties,
                serviceIds: s.service_ids || [],
                instagram_url: s.instagram_url,
                greeting_message: s.greeting_message,
                years_of_experience: s.years_of_experience,
                tags: s.tags,
                images: s.images || [],
                back_margin_rate: s.back_margin_rate,
                user_id: s.user_id,
                nomination_fee: s.nomination_fee,
                age: s.age,
                height: s.height,
                bust: s.bust,
                cup: s.cup,
                waist: s.waist,
                hip: s.hip,
                class_rank: s.class_rank,
                twitter_url: s.twitter_url,
                is_new_face: s.is_new_face
            })) as Staff[]
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    },

    async addStaff(staff: Omit<Staff, 'id'>) {
        try {
            const supabase = createClient()

            const targetStoreIds = staff.storeIds && staff.storeIds.length > 0 ? staff.storeIds : (staff.storeId ? [staff.storeId] : [])

            const dbStaff = {
                store_id: targetStoreIds[0] || null, // Keep for backward compatibility
                name: staff.name,
                role: staff.role,
                bio: staff.bio,
                avatar_url: staff.avatarUrl,
                specialties: staff.specialties,
                service_ids: staff.serviceIds,
                instagram_url: staff.instagram_url,
                greeting_message: staff.greeting_message,
                years_of_experience: staff.years_of_experience,
                tags: staff.tags,
                images: staff.images || [],
                back_margin_rate: staff.back_margin_rate || 0,
                user_id: staff.user_id || null,
                nomination_fee: staff.nomination_fee || 0,
                age: staff.age || null,
                height: staff.height || null,
                bust: staff.bust || null,
                cup: staff.cup || null,
                waist: staff.waist || null,
                hip: staff.hip || null,
                class_rank: staff.class_rank || null,
                twitter_url: staff.twitter_url || null,
                is_new_face: staff.is_new_face || false
            }

            const { data, error } = await supabase
                .from('staff')
                .insert([dbStaff])
                .select()
                .single()

            if (error) throw new Error(error.message)

            // Insert into store_staff junction table
            if (targetStoreIds.length > 0) {
                const storeStaffEntries = targetStoreIds.map(sid => ({
                    store_id: sid,
                    staff_id: data.id
                }))
                await supabase.from('store_staff').insert(storeStaffEntries)
            }

            return {
                id: data.id,
                storeId: data.store_id,
                storeIds: targetStoreIds,
                name: data.name,
                role: data.role,
                bio: data.bio,
                avatarUrl: data.avatar_url,
                specialties: data.specialties,
                serviceIds: data.service_ids,
                instagram_url: data.instagram_url,
                greeting_message: data.greeting_message,
                years_of_experience: data.years_of_experience,
                tags: data.tags,
                images: data.images,
                back_margin_rate: data.back_margin_rate,
                user_id: data.user_id,
                nomination_fee: data.nomination_fee,
                age: data.age,
                height: data.height,
                bust: data.bust,
                cup: data.cup,
                waist: data.waist,
                hip: data.hip,
                class_rank: data.class_rank,
                twitter_url: data.twitter_url,
                is_new_face: data.is_new_face
            } as Staff
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    },

    async updateStaff(id: string, updates: Partial<Staff>) {
        try {
            const supabase = createClient()

            const dbUpdates: Record<string, unknown> = {}
            if (updates.name) dbUpdates.name = updates.name
            if (updates.role) dbUpdates.role = updates.role
            if (updates.bio !== undefined) dbUpdates.bio = updates.bio
            if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl
            if (updates.specialties) dbUpdates.specialties = updates.specialties
            if (updates.serviceIds) dbUpdates.service_ids = updates.serviceIds
            if (updates.instagram_url !== undefined) dbUpdates.instagram_url = updates.instagram_url
            if (updates.greeting_message !== undefined) dbUpdates.greeting_message = updates.greeting_message
            if (updates.years_of_experience !== undefined) dbUpdates.years_of_experience = updates.years_of_experience
            if (updates.tags) dbUpdates.tags = updates.tags
            if (updates.images) dbUpdates.images = updates.images
            if (updates.back_margin_rate !== undefined) dbUpdates.back_margin_rate = updates.back_margin_rate
            if (updates.user_id !== undefined) dbUpdates.user_id = updates.user_id
            if (updates.nomination_fee !== undefined) dbUpdates.nomination_fee = updates.nomination_fee
            if (updates.age !== undefined) dbUpdates.age = updates.age
            if (updates.height !== undefined) dbUpdates.height = updates.height
            if (updates.bust !== undefined) dbUpdates.bust = updates.bust
            if (updates.cup !== undefined) dbUpdates.cup = updates.cup
            if (updates.waist !== undefined) dbUpdates.waist = updates.waist
            if (updates.hip !== undefined) dbUpdates.hip = updates.hip
            if (updates.class_rank !== undefined) dbUpdates.class_rank = updates.class_rank
            if (updates.twitter_url !== undefined) dbUpdates.twitter_url = updates.twitter_url
            if (updates.is_new_face !== undefined) dbUpdates.is_new_face = updates.is_new_face
            
            if (updates.storeIds && updates.storeIds.length > 0) {
                dbUpdates.store_id = updates.storeIds[0]
            }

            const { data, error } = await supabase
                .from('staff')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw new Error(error.message)

            // Update junction table if storeIds provided
            if (updates.storeIds) {
                await supabase.from('store_staff').delete().eq('staff_id', id)
                if (updates.storeIds.length > 0) {
                    const storeStaffEntries = updates.storeIds.map(sid => ({
                        store_id: sid,
                        staff_id: id
                    }))
                    await supabase.from('store_staff').insert(storeStaffEntries)
                }
            }

            return {
                id: data.id,
                storeId: data.store_id,
                storeIds: updates.storeIds || [],
                name: data.name,
                role: data.role,
                bio: data.bio,
                avatarUrl: data.avatar_url,
                specialties: data.specialties,
                serviceIds: data.service_ids,
                instagram_url: data.instagram_url,
                greeting_message: data.greeting_message,
                years_of_experience: data.years_of_experience,
                tags: data.tags,
                images: data.images,
                back_margin_rate: data.back_margin_rate,
                user_id: data.user_id,
                nomination_fee: data.nomination_fee,
                age: data.age,
                height: data.height,
                bust: data.bust,
                cup: data.cup,
                waist: data.waist,
                hip: data.hip,
                class_rank: data.class_rank,
                twitter_url: data.twitter_url,
                is_new_face: data.is_new_face
            } as Staff
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    },

    async deleteStaff(id: string) {
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('staff')
                .delete()
                .eq('id', id)

            if (error) throw new Error(error.message)
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    }
}
