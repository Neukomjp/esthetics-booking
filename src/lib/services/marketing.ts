import { createClient } from '@/lib/supabase/client'

export type MessageScript = {
    id: string
    store_id: string
    title: string
    content: string
    category: string | null
    created_at: string
    updated_at: string
}

export type TweetTemplate = {
    id: string
    store_id: string
    staff_id: string | null
    content: string
    created_at: string
    updated_at: string
    staff?: { name: string }
}

export type TweetSchedule = {
    id: string
    store_id: string
    staff_id: string | null
    content: string
    scheduled_at: string
    status: 'pending' | 'sent' | 'failed'
    created_at: string
    staff?: { name: string }
}

export const scriptService = {
    async getScripts(storeId: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('message_scripts')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)
        return (data || []) as MessageScript[]
    },

    async createScript(script: Omit<MessageScript, 'id' | 'created_at' | 'updated_at'>) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('message_scripts')
            .insert([script])
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as MessageScript
    },

    async updateScript(id: string, updates: Partial<MessageScript>) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('message_scripts')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as MessageScript
    },

    async deleteScript(id: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('message_scripts')
            .delete()
            .eq('id', id)

        if (error) throw new Error(error.message)
    }
}

export const tweetService = {
    async getTemplates(storeId: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('tweet_templates')
            .select('*, staff:staff_id(name)')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)
        return (data || []) as TweetTemplate[]
    },

    async getSchedules(storeId: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('tweet_schedules')
            .select('*, staff:staff_id(name)')
            .eq('store_id', storeId)
            .order('scheduled_at', { ascending: false })

        if (error) throw new Error(error.message)
        return (data || []) as TweetSchedule[]
    },

    async createSchedule(schedule: Omit<TweetSchedule, 'id' | 'created_at' | 'staff'>) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('tweet_schedules')
            .insert([schedule])
            .select('*, staff:staff_id(name)')
            .single()

        if (error) throw new Error(error.message)
        return data as TweetSchedule
    },

    async deleteSchedule(id: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('tweet_schedules')
            .delete()
            .eq('id', id)

        if (error) throw new Error(error.message)
    }
}
