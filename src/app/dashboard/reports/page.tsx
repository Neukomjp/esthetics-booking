import { storeService } from '@/lib/services/stores'
import { StoreSelector } from '@/app/dashboard/bookings/store-selector'
import { cookies } from 'next/headers'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
    
    const cookieStore = await cookies()
    const organizationId = cookieStore.get('organization-id')?.value

    try {
        stores = await storeService.getStores(organizationId);
        if (stores.length > 0) {
            storeId = urlStoreId && stores.find(s => s.id === urlStoreId) ? urlStoreId : stores[0].id;
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
                    <TabsTrigger value="media" className="text-[13px] data-[state=active]:bg-gray-100">媒体・経路分析</TabsTrigger>
                    <TabsTrigger value="room" className="text-[13px] data-[state=active]:bg-gray-100">ルーム稼働率</TabsTrigger>
                    <TabsTrigger value="month" className="text-[13px] data-[state=active]:bg-gray-100">月次損益(PL)</TabsTrigger>
                </TabsList>

                <TabsContent value="cast">
                    <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                        <Table className="min-w-max">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>キャスト名</TableHead>
                                    <TableHead className="text-right">総指名数</TableHead>
                                    <TableHead className="text-right">フリー数</TableHead>
                                    <TableHead className="text-right">総売上</TableHead>
                                    <TableHead className="text-right">指名売上</TableHead>
                                    <TableHead className="text-right">客単価</TableHead>
                                    <TableHead className="text-right">リピート率</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-gray-500 py-8 text-[13px]">
                                        データ集計中です。
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
                
                <TabsContent value="media">
                    <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                        <Table className="min-w-max">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>媒体名</TableHead>
                                    <TableHead className="text-right">予約数</TableHead>
                                    <TableHead className="text-right">売上高</TableHead>
                                    <TableHead className="text-right">CPA(顧客獲得単価)</TableHead>
                                    <TableHead className="text-right">ROAS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-gray-500 py-8 text-[13px]">
                                        データ集計中です。
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="room">
                     <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                        <Table className="min-w-max">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ルーム名</TableHead>
                                    <TableHead className="text-right">稼働時間</TableHead>
                                    <TableHead className="text-right">稼働率</TableHead>
                                    <TableHead className="text-right">総売上</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-gray-500 py-8 text-[13px]">
                                        データ集計中です。
                                    </TableCell>
                                </TableRow>
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
                                    <TableHead className="text-right text-red-600">経費</TableHead>
                                    <TableHead className="text-right text-red-600">給与・報酬</TableHead>
                                    <TableHead className="text-right font-bold">営業利益</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-gray-500 py-8 text-[13px]">
                                        データ集計中です。
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
