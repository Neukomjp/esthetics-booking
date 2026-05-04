/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/client'
import { StoreData } from '@/lib/types/store'

export const storeService = {
    async getStores(organizationId?: string, customClient?: unknown) {
        // Always use the passed server client or the browser client.
        // NEVER use Service Role Key here - rely on RLS policies for access control.
        const supabase = (customClient as any) || createClient()

        let query = supabase
            .from('stores')
            .select('*')
            .order('created_at', { ascending: false })

        if (organizationId) {
            query = query.eq('organization_id', organizationId)
        } else {
            // For Demo Login, use the known demo UUID if no auth user is found
            query = query.eq('organization_id', '11111111-1111-1111-1111-111111111111')
        }

        const { data, error } = await query
        if (error) {
            throw new Error(`Failed to fetch stores: ${error.message}`)
        }
        return data as StoreData[]
    },

    async getStoreById(id: string, organizationId?: string, customClient?: unknown) {
        const supabase = (customClient as any) || createClient()
        let query = supabase
            .from('stores')
            .select('*')
            .eq('id', id)

        if (organizationId) {
            query = query.eq('organization_id', organizationId)
        }

        const { data, error } = await query.single()
        if (error) throw new Error(error.message)
        return data as StoreData
    },

    async getStoreBySlug(slug: string, customClient?: unknown) {
        const supabase = (customClient as any) || createClient()
        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('slug', slug)
            .eq('is_published', true)
            .single()

        if (error) throw new Error(error.message)
        return data as StoreData
    },

    async createStore(name: string, slug: string, organizationId?: string, customClient?: unknown) {
        const supabase = (customClient as any) || createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            throw new Error('Not authenticated')
        }

        const storeId = crypto.randomUUID()
        const uniqueSlug = `${slug}-${storeId.slice(0, 8)}`

        const { data, error } = await supabase
            .from('stores')
            .insert([
                {
                    id: storeId,
                    name,
                    slug: uniqueSlug,
                    merchant_id: user.id,
                    organization_id: organizationId
                }
            ])
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data
    },

    async updateStore(id: string, updates: Partial<StoreData>, customClient?: unknown) {
        const supabase = (customClient as any) || createClient()
        const { data, error } = await supabase
            .from('stores')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data
    }
}
