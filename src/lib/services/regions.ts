import { createClient } from '@/lib/supabase/client'

export type Region = {
    id: string
    organization_id: string
    name: string
    description: string | null
    created_at: string
    updated_at: string
    store_count?: number
}

export const regionService = {
    async getRegions(organizationId: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('regions')
            .select('*')
            .eq('organization_id', organizationId)
            .order('name', { ascending: true })

        if (error) throw new Error(error.message)

        // Count stores per region
        const regions = data || []
        for (const region of regions) {
            const { count } = await supabase
                .from('stores')
                .select('id', { count: 'exact', head: true })
                .eq('region_id', region.id)
            region.store_count = count || 0
        }

        return regions as Region[]
    },

    async createRegion(organizationId: string, name: string, description?: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('regions')
            .insert([{ organization_id: organizationId, name, description }])
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as Region
    },

    async updateRegion(id: string, updates: { name?: string; description?: string }) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('regions')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as Region
    },

    async deleteRegion(id: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('regions')
            .delete()
            .eq('id', id)

        if (error) throw new Error(error.message)
    }
}
