import { storeService } from '@/lib/services/stores'
import { staffService } from '@/lib/services/staff'
import { StoreSelector } from '@/app/dashboard/bookings/store-selector'
import { cookies } from 'next/headers'
import { StaffList } from './staff-list'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function StaffPage(props: Props) {
    const searchParams = await props.searchParams;
    const urlStoreId = searchParams.store as string | undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let staffList: any[] = [];
    let storeId = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stores: any[] = [];

    const cookieStore = await cookies()
    const organizationId = cookieStore.get('organization-id')?.value

    try {
        stores = await storeService.getStores(organizationId);
        if (stores.length > 0) {
            // Use URL param, otherwise fallback to first store
            storeId = urlStoreId && stores.find(s => s.id === urlStoreId) ? urlStoreId : stores[0].id;
            staffList = await staffService.getStaffByStoreId(storeId);
        }
    } catch (error) {
        console.error('Failed to fetch staff:', error);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">キャスト管理</h2>
                    <StoreSelector stores={stores} currentStoreId={storeId} />
                </div>
            </div>
            
            {/* The dense list view for staff */}
            <StaffList initialStaff={staffList} storeId={storeId} />
        </div>
    )
}
