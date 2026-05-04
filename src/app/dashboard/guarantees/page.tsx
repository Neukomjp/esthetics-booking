import { storeService } from '@/lib/services/stores'
import { payoutService } from '@/lib/services/payouts'
import { StoreSelector } from '@/app/dashboard/bookings/store-selector'
import { cookies } from 'next/headers'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { GuaranteesClient } from './guarantees-client'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function GuaranteesPage(props: Props) {
    const searchParams = await props.searchParams;
    const urlStoreId = searchParams.store as string | undefined;
    const dateParam = searchParams.date as string | undefined;

    let storeId = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stores: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payouts: any[] = [];
    const targetDate = dateParam || format(new Date(), 'yyyy-MM-dd')

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
            payouts = await payoutService.getPayouts(storeId, targetDate, supabase)
        }
    } catch (error) {
        console.error('Failed to fetch guarantees:', error);
    }

    const totalPayout = payouts.reduce((sum, p) => sum + (p.total_amount || 0), 0)

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">日払い・給与計算</h2>
                    <StoreSelector stores={stores} currentStoreId={storeId} />
                </div>
            </div>
            
            <GuaranteesClient initialPayouts={payouts} storeId={storeId} targetDate={targetDate} />
        </div>
    )
}
