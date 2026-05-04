import { storeService } from '@/lib/services/stores'
import { StoreSelector } from '@/app/dashboard/bookings/store-selector'
import { cookies } from 'next/headers'
import { StaffManager } from '@/app/dashboard/stores/[id]/staff-manager'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function StaffPage(props: Props) {
    const searchParams = await props.searchParams;
    const urlStoreId = searchParams.store as string | undefined;

    let storeId = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stores: any[] = [];

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
            // Use URL param, otherwise fallback to first store
            storeId = urlStoreId && stores.find(s => s.id === urlStoreId) ? urlStoreId : stores[0].id;
        }
    } catch (error) {
        console.error('Failed to fetch stores:', error);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">キャスト管理</h2>
                    <StoreSelector stores={stores} currentStoreId={storeId} />
                </div>
            </div>
            
            {/* Unified Staff Manager Component */}
            {storeId ? (
                <StaffManager storeId={storeId} />
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    店舗が見つかりません。先に店舗を作成してください。
                </div>
            )}
        </div>
    )
}

