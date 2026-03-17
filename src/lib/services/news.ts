import { createClient } from '@/lib/supabase/client'

export type News = {
    id: string
    store_id: string
    title: string
    content?: string
    image_url?: string
    url?: string
    is_published: boolean
    published_at: string
    created_at: string
}

export const newsService = {
    async getNewsByStoreId(storeId: string) {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('news')
                .select('*')
                .eq('store_id', storeId)
                .order('published_at', { ascending: false })

            if (error) throw new Error(error.message)
            return data as News[]
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    },

    async addNews(news: Omit<News, 'id' | 'created_at'>) {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('news')
                .insert([news])
                .select()
                .single()

            if (error) throw new Error(error.message)
            return data as News
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    },

    async updateNews(id: string, updates: Partial<News>) {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('news')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw new Error(error.message)
            return data as News
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    },

    async deleteNews(id: string) {
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('news')
                .delete()
                .eq('id', id)

            if (error) throw new Error(error.message)
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : JSON.stringify(error))
        }
    }
}
