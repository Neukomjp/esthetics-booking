import { storeService } from '@/lib/services/stores'
import { expenseService } from '@/lib/services/expenses'
import { StoreSelector } from '@/app/dashboard/bookings/store-selector'
import { cookies } from 'next/headers'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ExpensesClient } from './expenses-client'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ExpensesPage(props: Props) {
    const searchParams = await props.searchParams;
    const urlStoreId = searchParams.store as string | undefined;

    let storeId = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stores: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let expenses: any[] = [];
    let monthlyTotal = 0;

    const cookieStore = await cookies()
    let organizationId = cookieStore.get('organization-id')?.value
    if (!organizationId) {
        const { getUserOrganizationsAction } = await import('@/lib/actions/organization')
        const orgs = await getUserOrganizationsAction()
        organizationId = orgs[0]?.id
    }
    const supabase = await createClient()

    try {
        stores = await storeService.getStores(organizationId, supabase);
        if (stores.length > 0) {
            storeId = urlStoreId && stores.find(s => s.id === urlStoreId) ? urlStoreId : stores[0].id;
            const [expenseData, total] = await Promise.all([
                expenseService.getExpenses(storeId),
                expenseService.getMonthlyTotal(storeId)
            ])
            expenses = expenseData
            monthlyTotal = total
        }
    } catch (error) {
        console.error('Failed to fetch expenses:', error);
    }

    const categoryLabels: Record<string, string> = {
        supplies: '消耗品費',
        rent: '家賃',
        utilities: '水道光熱費',
        transport: '交通費',
        advertising: '広告宣伝費',
        other: 'その他',
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">経費管理</h2>
                    <StoreSelector stores={stores} currentStoreId={storeId} />
                </div>
            </div>
            
            {storeId ? (
                <ExpensesClient 
                    initialExpenses={expenses} 
                    storeId={storeId} 
                    initialMonthlyTotal={monthlyTotal} 
                />
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    店舗が見つかりません。先に店舗を作成してください。
                </div>
            )}
        </div>
    )
}
