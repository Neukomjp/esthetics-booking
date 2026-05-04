import { storeService } from '@/lib/services/stores'
import { salesService } from '@/lib/services/sales'
import { StoreSelector } from '@/app/dashboard/bookings/store-selector'
import { cookies } from 'next/headers'
import { staffService } from '@/lib/services/staff'
import { bookingService } from '@/lib/services/bookings'
import { createClient } from '@/lib/supabase/server'
import { ReportsClient } from './reports-client'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ReportsPage(props: Props) {
    const searchParams = await props.searchParams;
    const urlStoreId = searchParams.store as string | undefined;

    let storeId = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stores: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let castSalesData: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let monthlySalesData: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dailySalesData: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let weeklySalesData: any[] = [];
    
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
            
            // Fetch all report data
            const [staffList, bookings, monthly, daily, weekly] = await Promise.all([
                staffService.getStaffByStoreId(storeId, supabase),
                bookingService.getBookingsByStoreId(storeId),
                salesService.getMonthlySales(storeId),
                salesService.getDailySales(storeId, 30),
                salesService.getWeeklySales(storeId, 12)
            ])
            
            monthlySalesData = monthly
            dailySalesData = daily
            weeklySalesData = weekly

            // Aggregate bookings by staff
            const staffMap: Record<string, { name: string; totalSales: number; bookingCount: number; nominationCount: number }> = {}
            for (const staff of staffList) {
                staffMap[staff.id] = { name: staff.name, totalSales: 0, bookingCount: 0, nominationCount: 0 }
            }
            for (const b of bookings || []) {
                if (b.staff_id && staffMap[b.staff_id] && b.status !== 'cancelled') {
                    staffMap[b.staff_id].totalSales += b.total_price || 0
                    staffMap[b.staff_id].bookingCount += 1
                    staffMap[b.staff_id].nominationCount += 1
                }
            }
            castSalesData = Object.entries(staffMap).map(([id, data]) => ({
                id,
                ...data,
                avgPrice: data.bookingCount > 0 ? Math.round(data.totalSales / data.bookingCount) : 0
            })).sort((a, b) => b.totalSales - a.totalSales)
        }
    } catch (error) {
        console.error('Failed to fetch stores for reports:', error);
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">レポート・分析</h2>
                    <StoreSelector stores={stores} currentStoreId={storeId} />
                </div>
            </div>

            <ReportsClient 
                dailySalesData={dailySalesData}
                weeklySalesData={weeklySalesData}
                monthlySalesData={monthlySalesData}
                castSalesData={castSalesData}
            />
        </div>
    )
}
