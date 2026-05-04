import { storeService } from '@/lib/services/stores'
import { salesService } from '@/lib/services/sales'
import { StoreSelector } from '@/app/dashboard/bookings/store-selector'
import { cookies } from 'next/headers'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { staffService } from '@/lib/services/staff'
import { bookingService } from '@/lib/services/bookings'
import { createClient } from '@/lib/supabase/server'

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
            
            // Fetch cast-level sales data
            const [staffList, bookings, monthly] = await Promise.all([
                staffService.getStaffByStoreId(storeId, supabase),
                bookingService.getBookingsByStoreId(storeId),
                salesService.getMonthlySales(storeId)
            ])
            
            monthlySalesData = monthly

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

            <Tabs defaultValue="cast" className="space-y-4">
                <TabsList className="bg-white border border-gray-200">
                    <TabsTrigger value="cast" className="text-[13px] data-[state=active]:bg-gray-100">キャスト別売上</TabsTrigger>
                    <TabsTrigger value="month" className="text-[13px] data-[state=active]:bg-gray-100">月次推移</TabsTrigger>
                </TabsList>

                <TabsContent value="cast">
                    <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                        <Table className="min-w-max">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>キャスト名</TableHead>
                                    <TableHead className="text-right">予約数</TableHead>
                                    <TableHead className="text-right">総売上</TableHead>
                                    <TableHead className="text-right">客単価</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {castSalesData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-gray-500 py-8 text-[13px]">
                                            データがありません。
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    castSalesData.map((cast) => (
                                        <TableRow key={cast.id}>
                                            <TableCell className="text-[13px] font-bold text-blue-600">{cast.name}</TableCell>
                                            <TableCell className="text-right text-[13px]">{cast.bookingCount}件</TableCell>
                                            <TableCell className="text-right text-[13px] font-medium text-red-600">¥{cast.totalSales.toLocaleString()}</TableCell>
                                            <TableCell className="text-right text-[13px]">¥{cast.avgPrice.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="month">
                     <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                        <Table className="min-w-max">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>月</TableHead>
                                    <TableHead className="text-right text-blue-600">売上高</TableHead>
                                    <TableHead className="text-right">予約数</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monthlySalesData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-gray-500 py-8 text-[13px]">
                                            データがありません。
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    monthlySalesData.map((m) => (
                                        <TableRow key={m.month}>
                                            <TableCell className="text-[13px] font-medium">{m.month}</TableCell>
                                            <TableCell className="text-right text-[13px] font-medium text-blue-600">¥{m.sales.toLocaleString()}</TableCell>
                                            <TableCell className="text-right text-[13px]">{m.bookings}件</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
