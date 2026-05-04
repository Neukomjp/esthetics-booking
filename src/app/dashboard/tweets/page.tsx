import { storeService } from '@/lib/services/stores'
import { tweetService } from '@/lib/services/marketing'
import { StoreSelector } from '@/app/dashboard/bookings/store-selector'
import { cookies } from 'next/headers'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Twitter } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

import { staffService } from '@/lib/services/staff'
import { TweetsClient } from './tweets-client'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function TweetsPage(props: Props) {
    const searchParams = await props.searchParams;
    const urlStoreId = searchParams.store as string | undefined;

    let storeId = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stores: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let schedules: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let staffList: any[] = [];
    
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
            schedules = await tweetService.getSchedules(storeId)
            staffList = await staffService.getStaffByStoreId(storeId, supabase)
        }
    } catch (error) {
        console.error('Failed to fetch stores for tweets:', error);
    }
    const currentStore = storeId ? stores.find(s => s.id === storeId) : null;

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">Bluesky自動投稿管理</h2>
                    <StoreSelector stores={stores} currentStoreId={storeId} />
                </div>
            </div>

            {storeId && currentStore ? (
                <TweetsClient 
                    initialSchedules={schedules} 
                    storeId={storeId} 
                    staffList={staffList} 
                    blueskyHandle={currentStore.bluesky_handle} 
                />
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    店舗が見つかりません。先に店舗を作成してください。
                </div>
            )}
        </div>
    )
}
