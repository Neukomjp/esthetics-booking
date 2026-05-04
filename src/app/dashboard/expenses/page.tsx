import { storeService } from '@/lib/services/stores'
import { StoreSelector } from '@/app/dashboard/bookings/store-selector'
import { cookies } from 'next/headers'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2 } from 'lucide-react'

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
    const expenses: any[] = []; // Placeholder until API is fully implemented

    const cookieStore = await cookies()
    const organizationId = cookieStore.get('organization-id')?.value

    try {
        stores = await storeService.getStores(organizationId);
        if (stores.length > 0) {
            storeId = urlStoreId && stores.find(s => s.id === urlStoreId) ? urlStoreId : stores[0].id;
            // Fetch expenses logic would go here
        }
    } catch (error) {
        console.error('Failed to fetch expenses:', error);
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">経費管理</h2>
                    <StoreSelector stores={stores} currentStoreId={storeId} />
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                <Input 
                    type="date" 
                    className="w-[150px] h-8 text-[13px]" 
                />
                <span className="text-gray-500">〜</span>
                <Input 
                    type="date" 
                    className="w-[150px] h-8 text-[13px]" 
                />
                <Button className="h-8 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 text-[13px] border border-gray-300">絞り込み</Button>
                
                <div className="ml-auto">
                    <Button className="h-8 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold">
                        <Plus className="mr-1 h-4 w-4" /> 経費を登録
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
                <div className="bg-white border border-gray-200 p-3 rounded-md shadow-sm">
                    <div className="text-[12px] text-gray-500 mb-1">今月の経費合計</div>
                    <div className="text-xl font-bold text-red-600">¥0</div>
                </div>
            </div>

            <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                <Table className="min-w-max">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">日付</TableHead>
                            <TableHead className="w-[150px]">勘定科目</TableHead>
                            <TableHead>摘要・詳細</TableHead>
                            <TableHead className="text-right w-[150px]">金額</TableHead>
                            <TableHead className="text-center w-[100px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-500 py-8 text-[13px]">
                                    経費データが登録されていません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            expenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell className="text-[13px]">{expense.date}</TableCell>
                                    <TableCell className="text-[13px]">{expense.category}</TableCell>
                                    <TableCell className="text-[13px]">{expense.description}</TableCell>
                                    <TableCell className="text-right font-medium text-red-600 text-[13px]">¥{expense.amount.toLocaleString()}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button className="text-red-600 hover:bg-red-50 p-1 rounded">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
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
