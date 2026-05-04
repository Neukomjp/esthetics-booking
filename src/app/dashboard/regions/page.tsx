import { cookies } from 'next/headers'
import { regionService } from '@/lib/services/regions'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RegionsPage() {
    const cookieStore = await cookies()
    let organizationId = cookieStore.get('organization-id')?.value
    if (!organizationId) {
        const { getUserOrganizationsAction } = await import('@/lib/actions/organization')
        const orgs = await getUserOrganizationsAction()
        organizationId = orgs[0]?.id
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let regions: any[] = []
    
    if (organizationId) {
        try {
            regions = await regionService.getRegions(organizationId)
        } catch (error) {
            console.error('Failed to fetch regions:', error)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">エリア・リージョン管理</h2>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                <Button className="h-8 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold">
                    <Plus className="mr-1 h-4 w-4" /> 新規エリアを作成
                </Button>
                <div className="ml-auto text-[13px] text-gray-500">
                    {regions.length}件 登録済み
                </div>
            </div>

            <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                <Table className="min-w-max">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">エリア名</TableHead>
                            <TableHead>説明</TableHead>
                            <TableHead className="text-right w-[150px]">所属店舗数</TableHead>
                            <TableHead className="text-center w-[100px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {regions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-gray-500 py-8 text-[13px]">
                                    登録されているエリアはありません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            regions.map((region) => (
                                <TableRow key={region.id}>
                                    <TableCell className="text-[13px] font-bold text-blue-600">{region.name}</TableCell>
                                    <TableCell className="text-[13px] text-gray-600">{region.description || '-'}</TableCell>
                                    <TableCell className="text-right text-[13px]">{region.store_count || 0}店舗</TableCell>
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
