import { createClient } from '@/lib/supabase/client'

export type Expense = {
    id: string
    store_id: string
    category: string
    amount: number
    description: string | null
    expense_date: string
    created_by: string | null
    created_at: string
    updated_at: string
}

export const expenseService = {
    async getExpenses(storeId: string, startDate?: string, endDate?: string) {
        const supabase = createClient()
        let query = supabase
            .from('expenses')
            .select('*')
            .eq('store_id', storeId)
            .order('expense_date', { ascending: false })

        if (startDate) query = query.gte('expense_date', startDate)
        if (endDate) query = query.lte('expense_date', endDate)

        const { data, error } = await query
        if (error) throw new Error(error.message)
        return (data || []) as Expense[]
    },

    async createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('expenses')
            .insert([expense])
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as Expense
    },

    async updateExpense(id: string, updates: Partial<Expense>) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('expenses')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return data as Expense
    },

    async deleteExpense(id: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id)

        if (error) throw new Error(error.message)
    },

    async getMonthlyTotal(storeId: string) {
        const supabase = createClient()
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

        const { data, error } = await supabase
            .from('expenses')
            .select('amount')
            .eq('store_id', storeId)
            .gte('expense_date', startOfMonth)

        if (error) throw new Error(error.message)
        return (data || []).reduce((sum, e) => sum + (e.amount || 0), 0)
    }
}
