import { storeService } from '@/lib/services/stores'
import { tweetService } from '@/lib/services/marketing'
import { StoreSelector } from '@/app/dashboard/bookings/store-selector'
import { cookies } from 'next/headers'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Twitter } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

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
        }
    } catch (error) {
        console.error('Failed to fetch stores for tweets:', error);
    }

    const statusLabels: Record<string, { label: string; className: string }> = {
        pending: { label: '予約中', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        sent: { label: '送信済', className: 'bg-green-100 text-green-800 border-green-200' },
        failed: { label: '失敗', className: 'bg-red-100 text-red-800 border-red-200' },
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
                            <TableHead className="w-[180px]">投稿予定日時</TableHead>
                            <TableHead className="w-[150px]">対象キャスト</TableHead>
                            <TableHead>投稿内容（プレビュー）</TableHead>
                            <TableHead className="text-center w-[100px]">状態</TableHead>
                            <TableHead className="text-center w-[100px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {schedules.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-500 py-8 text-[13px]">
                                    スケジュールされたツイートはありません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            schedules.map((schedule) => {
                                const status = statusLabels[schedule.status] || statusLabels.pending
                                return (
                                    <TableRow key={schedule.id}>
                                        <TableCell className="text-[13px]">
                                            {new Date(schedule.scheduled_at).toLocaleString('ja-JP', {
                                                year: 'numeric', month: '2-digit', day: '2-digit',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell className="text-[13px] text-blue-600">{schedule.staff?.name || '全体'}</TableCell>
                                        <TableCell className="text-[13px] max-w-[300px] truncate">{schedule.content}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={`font-normal text-[11px] px-2 py-0 h-5 ${status.className}`}>
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="sm" className="h-6 text-[11px] text-red-600">削除</Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
