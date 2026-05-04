import { storeService } from '@/lib/services/stores'
import { staffService } from '@/lib/services/staff'
import { shiftService } from '@/lib/services/shifts'
import { StoreSelector } from '@/app/dashboard/bookings/store-selector'
import { cookies } from 'next/headers'
import { startOfWeek, addDays, format } from 'date-fns'
import { ShiftMatrix } from './shift-matrix'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ShiftsPage(props: Props) {
    const searchParams = await props.searchParams;
    const urlStoreId = searchParams.store as string | undefined;

    let storeId = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stores: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let staffList: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let weeklyShifts: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let shiftExceptions: any[] = [];

    const cookieStore = await cookies()
    let organizationId = cookieStore.get('organization-id')?.value
    if (!organizationId) {
        const { getUserOrganizationsAction } = await import('@/lib/actions/organization')
        const orgs = await getUserOrganizationsAction()
        organizationId = orgs[0]?.id
    }
    const supabase = await createClient()

    const today = new Date()
    // Start from Monday
    const startDate = startOfWeek(today, { weekStartsOn: 1 })
    
    // Create an array of 7 dates for the week
    const weekDates = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i))

    try {
        stores = await storeService.getStores(organizationId, supabase);
        if (stores.length > 0) {
            storeId = urlStoreId && stores.find(s => s.id === urlStoreId) ? urlStoreId : stores[0].id;
            
            // Fetch staff for this store
            staffList = await staffService.getStaffByStoreId(storeId, supabase);
            
            if (staffList.length > 0) {
                const staffIds = staffList.map(s => s.id);
                
                // Fetch default weekly shifts
                weeklyShifts = await shiftService.getShiftsByStoreId(storeId);
                
                // Fetch exceptions for this week
                const startStr = format(weekDates[0], 'yyyy-MM-dd')
                const endStr = format(weekDates[6], 'yyyy-MM-dd')
                shiftExceptions = await shiftService.getShiftExceptionsByStoreId(storeId, startStr, endStr);
            }
        }
    } catch (error) {
        console.error('Failed to fetch shifts:', error);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">シフト管理</h2>
                    <StoreSelector stores={stores} currentStoreId={storeId} />
                </div>
            </div>
            
            <ShiftMatrix 
                storeId={storeId} 
                staffList={staffList} 
                weeklyShifts={weeklyShifts} 
                shiftExceptions={shiftExceptions} 
                weekDates={weekDates} 
            />
        </div>
    )
}
