import { storeService } from '@/lib/services/stores'
import { scriptService } from '@/lib/services/marketing'
import { StoreSelector } from '@/app/dashboard/bookings/store-selector'
import { cookies } from 'next/headers'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ScriptsPage(props: Props) {
    const searchParams = await props.searchParams;
    const urlStoreId = searchParams.store as string | undefined;

    let storeId = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stores: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scripts: any[] = [];
    
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
            scripts = await scriptService.getScripts(storeId)
        }
    } catch (error) {
        console.error('Failed to fetch stores for scripts:', error);
    }

    const categoryLabels: Record<string, string> = {
        greeting: 'あいさつ',
        thanks: 'お礼',
        reminder: 'リマインド',
        promotion: 'プロモーション',
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">定型文・スクリプト管理</h2>
                    <StoreSelector stores={stores} currentStoreId={storeId} />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                <Button className="h-8 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold">
                    <Plus className="mr-1 h-4 w-4" /> 新規定型文を作成
                </Button>
                <div className="ml-auto text-[13px] text-gray-500">
                    {scripts.length}件 登録済み
                </div>
            </div>

            <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                <Table className="min-w-max">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">タイトル</TableHead>
                            <TableHead className="w-[120px]">カテゴリ</TableHead>
                            <TableHead>本文</TableHead>
                            <TableHead className="text-center w-[100px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {scripts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-gray-500 py-8 text-[13px]">
                                    登録されている定型文はありません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            scripts.map((script) => (
                                <TableRow key={script.id}>
                                    <TableCell className="text-[13px] font-bold text-blue-600">{script.title}</TableCell>
                                    <TableCell className="text-[13px]">{categoryLabels[script.category] || script.category || '-'}</TableCell>
                                    <TableCell className="text-[13px] max-w-[400px] truncate text-gray-600">{script.content}</TableCell>
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
