import { storeService } from '@/lib/services/stores'
import { StoreSelector } from '@/app/dashboard/bookings/store-selector'
import { cookies } from 'next/headers'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Twitter } from 'lucide-react'

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
    
    const cookieStore = await cookies()
    const organizationId = cookieStore.get('organization-id')?.value

    try {
        stores = await storeService.getStores(organizationId);
        if (stores.length > 0) {
            storeId = urlStoreId && stores.find(s => s.id === urlStoreId) ? urlStoreId : stores[0].id;
        }
    } catch (error) {
        console.error('Failed to fetch stores for tweets:', error);
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">自動ツイート管理</h2>
                    <StoreSelector stores={stores} currentStoreId={storeId} />
                </div>
                <Button className="h-8 px-4 bg-[#1DA1F2] hover:bg-[#1a91da] text-white text-[13px] font-bold">
                    <Twitter className="mr-1 h-4 w-4" /> アカウント連携
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                <Button className="h-8 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold">
                    <Plus className="mr-1 h-4 w-4" /> 新規スケジュール
                </Button>
            </div>

            <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                <Table className="min-w-max">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">投稿予定日時</TableHead>
                            <TableHead className="w-[150px]">対象キャスト</TableHead>
                            <TableHead>投稿内容（プレビュー）</TableHead>
                            <TableHead className="text-center w-[100px]">状態</TableHead>
                            <TableHead className="text-center w-[100px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-gray-500 py-8 text-[13px]">
                                スケジュールされたツイートはありません。
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
