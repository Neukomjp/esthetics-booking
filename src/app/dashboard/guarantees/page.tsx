import { storeService } from '@/lib/services/stores'
import { payoutService } from '@/lib/services/payouts'
import { StoreSelector } from '@/app/dashboard/bookings/store-selector'
import { cookies } from 'next/headers'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calculator, Download } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'

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
            payouts = await payoutService.getPayouts(storeId, targetDate)
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
            
            <div className="flex flex-wrap items-center gap-2 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                <Input 
                    type="date" 
                    className="w-[150px] h-8 text-[13px]" 
                    defaultValue={targetDate}
                />
                <Button className="h-8 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 text-[13px] border border-gray-300">対象日変更</Button>
                
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" className="h-8 px-4 text-[13px]">
                        <Download className="mr-1 h-4 w-4" /> CSVエクスポート
                    </Button>
                    <Button className="h-8 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold">
                        <Calculator className="mr-1 h-4 w-4" /> 本日の給与計算を実行
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div className="bg-white border border-gray-200 p-3 rounded-md shadow-sm">
                    <div className="text-[12px] text-gray-500 mb-1">対象日</div>
                    <div className="text-lg font-bold text-gray-800">{targetDate}</div>
                </div>
                <div className="bg-white border border-gray-200 p-3 rounded-md shadow-sm">
                    <div className="text-[12px] text-gray-500 mb-1">支給対象者数</div>
                    <div className="text-xl font-bold text-blue-600">{payouts.length}名</div>
                </div>
                <div className="bg-white border border-gray-200 p-3 rounded-md shadow-sm">
                    <div className="text-[12px] text-gray-500 mb-1">支給総額</div>
                    <div className="text-xl font-bold text-red-600">¥{totalPayout.toLocaleString()}</div>
                </div>
            </div>

            <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                <Table className="min-w-max">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">キャスト</TableHead>
                            <TableHead className="text-right w-[120px]">基本給・保証</TableHead>
                            <TableHead className="text-right w-[120px]">指名・歩合</TableHead>
                            <TableHead className="text-right w-[120px]">控除（雑費等）</TableHead>
                            <TableHead className="text-right w-[150px] font-bold bg-blue-50/50">支給総額</TableHead>
                            <TableHead className="text-center w-[100px]">状態</TableHead>
                            <TableHead className="text-center w-[80px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payouts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-gray-500 py-8 text-[13px]">
                                    指定日の給与データがありません。「計算を実行」ボタンを押してください。
                                </TableCell>
                            </TableRow>
                        ) : (
                            payouts.map((payout) => (
                                <TableRow key={payout.id}>
                                    <TableCell className="text-[13px] font-bold text-blue-600">{payout.staff?.name || '-'}</TableCell>
                                    <TableCell className="text-right text-[13px]">¥{(payout.base_amount || 0).toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-[13px] text-green-600">¥{(payout.back_amount || 0).toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-[13px] text-red-600">-¥{(payout.deduction_amount || 0).toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-bold text-[14px] bg-blue-50/20">¥{(payout.total_amount || 0).toLocaleString()}</TableCell>
                                    <TableCell className="text-center">
                                        <span className={`px-2 py-0.5 rounded text-[11px] ${payout.is_paid ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {payout.is_paid ? '支払済' : '未払い'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button variant="ghost" size="sm" className="h-6 text-[11px] text-blue-600">編集</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
