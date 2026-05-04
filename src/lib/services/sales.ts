import { createClient } from '@/lib/supabase/client'

export type SalesSummary = {
    totalSales: number
    totalBookings: number
    salesGrowth: number // Percentage vs last period
    bookingsGrowth: number // Percentage vs last period
}

export type MonthlySales = {
    month: string // YYYY-MM
    sales: number
    bookings: number
    expenses: number
    payouts: number
    profit: number
}

export const salesService = {
    async getSalesSummary(storeId: string): Promise<SalesSummary> {
        const supabase = createClient()
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString()

        // Fetch current month bookings
        const { data: currentMonthData, error: currentError } = await supabase
            .from('bookings')
            .select('total_price, id')
            .eq('store_id', storeId)
            .gte('start_time', startOfMonth)
            .neq('status', 'cancelled')

        if (currentError) throw currentError

        // Fetch last month bookings for growth calc
        const { data: lastMonthData, error: lastError } = await supabase
            .from('bookings')
            .select('total_price, id')
            .eq('store_id', storeId)
            .gte('start_time', startOfLastMonth)
            .lte('start_time', endOfLastMonth)
            .neq('status', 'cancelled')

        if (lastError) throw lastError

        const currentSales = currentMonthData?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0
        const currentBookings = currentMonthData?.length || 0

        const lastSales = lastMonthData?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0
        const lastBookings = lastMonthData?.length || 0

        // Calculate growth
        const salesGrowth = lastSales === 0 ? 100 : ((currentSales - lastSales) / lastSales) * 100
        const bookingsGrowth = lastBookings === 0 ? 100 : ((currentBookings - lastBookings) / lastBookings) * 100

        return {
            totalSales: currentSales,
            totalBookings: currentBookings,
            salesGrowth: Math.round(salesGrowth * 10) / 10,
            bookingsGrowth: Math.round(bookingsGrowth * 10) / 10
        }
    },

    async getMonthlySales(storeId: string): Promise<MonthlySales[]> {
        const supabase = createClient()
        const now = new Date()
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()
        const sixMonthsAgoDateOnly = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]

        const [bookingsRes, expensesRes, payoutsRes] = await Promise.all([
            supabase.from('bookings').select('start_time, total_price').eq('store_id', storeId).gte('start_time', sixMonthsAgo).neq('status', 'cancelled').order('start_time', { ascending: true }),
            supabase.from('expenses').select('expense_date, amount').eq('store_id', storeId).gte('expense_date', sixMonthsAgoDateOnly),
            supabase.from('daily_payouts').select('payout_date, total_amount').eq('store_id', storeId).gte('payout_date', sixMonthsAgoDateOnly)
        ])

        const aggregation: Record<string, MonthlySales> = {}

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
            aggregation[key] = { month: key, sales: 0, bookings: 0, expenses: 0, payouts: 0, profit: 0 }
        }

        bookingsRes.data?.forEach((b) => {
            const date = new Date(b.start_time)
            const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
            if (aggregation[key]) {
                aggregation[key].sales += (b.total_price || 0)
                aggregation[key].bookings += 1
            }
        })

        expensesRes.data?.forEach((e) => {
            const key = e.expense_date.substring(0, 7) // YYYY-MM
            if (aggregation[key]) aggregation[key].expenses += (e.amount || 0)
        })

        payoutsRes.data?.forEach((p) => {
            const key = p.payout_date.substring(0, 7)
            if (aggregation[key]) aggregation[key].payouts += (p.total_amount || 0)
        })

        return Object.values(aggregation).map(a => ({
            ...a,
            profit: a.sales - a.expenses - a.payouts
        }))
    },

    async getDailySales(storeId: string, days: number = 30): Promise<{ date: string; sales: number; bookings: number; expenses: number; payouts: number; profit: number }[]> {
        const supabase = createClient()
        const now = new Date()
        const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1).toISOString()
        const startDateOnly = startDate.split('T')[0]

        const [bookingsRes, expensesRes, payoutsRes] = await Promise.all([
            supabase.from('bookings').select('start_time, total_price').eq('store_id', storeId).gte('start_time', startDate).neq('status', 'cancelled').order('start_time', { ascending: true }),
            supabase.from('expenses').select('expense_date, amount').eq('store_id', storeId).gte('expense_date', startDateOnly),
            supabase.from('daily_payouts').select('payout_date, total_amount').eq('store_id', storeId).gte('payout_date', startDateOnly)
        ])

        const aggregation: Record<string, { date: string; sales: number; bookings: number; expenses: number; payouts: number; profit: number }> = {}

        // Initialize last N days
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
            const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
            aggregation[key] = { date: key, sales: 0, bookings: 0, expenses: 0, payouts: 0, profit: 0 }
        }

        bookingsRes.data?.forEach((b) => {
            const d = new Date(b.start_time)
            const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
            if (aggregation[key]) {
                aggregation[key].sales += (b.total_price || 0)
                aggregation[key].bookings += 1
            }
        })

        expensesRes.data?.forEach((e) => {
            if (aggregation[e.expense_date]) aggregation[e.expense_date].expenses += (e.amount || 0)
        })

        payoutsRes.data?.forEach((p) => {
            if (aggregation[p.payout_date]) aggregation[p.payout_date].payouts += (p.total_amount || 0)
        })

        return Object.values(aggregation).map(a => ({
            ...a,
            profit: a.sales - a.expenses - a.payouts
        }))
    },

    async getWeeklySales(storeId: string, weeks: number = 12): Promise<{ week: string; sales: number; bookings: number; expenses: number; payouts: number; profit: number }[]> {
        const supabase = createClient()
        const now = new Date()
        const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (weeks * 7) + 1).toISOString()
        const startDateOnly = startDate.split('T')[0]

        const [bookingsRes, expensesRes, payoutsRes] = await Promise.all([
            supabase.from('bookings').select('start_time, total_price').eq('store_id', storeId).gte('start_time', startDate).neq('status', 'cancelled').order('start_time', { ascending: true }),
            supabase.from('expenses').select('expense_date, amount').eq('store_id', storeId).gte('expense_date', startDateOnly),
            supabase.from('daily_payouts').select('payout_date, total_amount').eq('store_id', storeId).gte('payout_date', startDateOnly)
        ])

        const aggregation: Record<string, { week: string; sales: number; bookings: number; expenses: number; payouts: number; profit: number }> = {}

        // Helper to get Monday of a week
        const getMonday = (d: Date | string) => {
            const date = new Date(d)
            const day = date.getDay()
            const diff = date.getDate() - day + (day === 0 ? -6 : 1)
            return new Date(date.setDate(diff))
        }

        const formatKey = (d: Date) => `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`

        // Initialize last N weeks
        for (let i = weeks - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7))
            const monday = getMonday(d)
            const key = formatKey(monday)
            aggregation[key] = { week: key, sales: 0, bookings: 0, expenses: 0, payouts: 0, profit: 0 }
        }

        bookingsRes.data?.forEach((b) => {
            const key = formatKey(getMonday(b.start_time))
            if (aggregation[key]) {
                aggregation[key].sales += (b.total_price || 0)
                aggregation[key].bookings += 1
            }
        })

        expensesRes.data?.forEach((e) => {
            const key = formatKey(getMonday(e.expense_date))
            if (aggregation[key]) aggregation[key].expenses += (e.amount || 0)
        })

        payoutsRes.data?.forEach((p) => {
            const key = formatKey(getMonday(p.payout_date))
            if (aggregation[key]) aggregation[key].payouts += (p.total_amount || 0)
        })

        return Object.values(aggregation).map(a => ({
            ...a,
            profit: a.sales - a.expenses - a.payouts
        }))
    }
}
