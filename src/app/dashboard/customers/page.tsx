/* eslint-disable @next/next/no-img-element */
import { customerService } from '@/lib/services/customers'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StoreSelector } from '@/app/dashboard/bookings/store-selector'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { cookies } from 'next/headers'
import { canViewCustomers } from '@/lib/rbac'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Props = {
    searchParams: Promise<{ q?: string }>
}

export default async function CustomersPage(props: Props) {
    const searchParams = await props.searchParams
    const query = searchParams.q

    const cookieStore = await cookies()

    // Get organization ID
    let orgId = cookieStore.get('organization-id')?.value
    if (!orgId) {
        const { getUserOrganizationsAction } = await import('@/lib/actions/organization')
        const orgs = await getUserOrganizationsAction()
        orgId = orgs[0]?.id
    }

    let storeId: string = cookieStore.get('store-id')?.value || ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stores: any[] = []

    // Validate that the storeId actually belongs to this organization
    if (orgId) {
        const { storeService } = await import('@/lib/services/stores')
        stores = await storeService.getStores(orgId)
        const validStoreIds = stores.map(s => s.id)

        if (!storeId || !validStoreIds.includes(storeId)) {
            storeId = stores.length > 0 ? stores[0].id : ''
        }
    }

    // Role check logic
    let hasAccess = false
    if (orgId) {
        const { getUserOrganizationsAction } = await import('@/lib/actions/organization')
        const orgs = await getUserOrganizationsAction()
        const currentOrg = orgs.find(o => o.id === orgId) || orgs[0]
        hasAccess = currentOrg ? canViewCustomers(currentOrg.role as any) : false
    } else {
        hasAccess = true
    }

    if (!hasAccess) {
        return (
            <div className="space-y-6">
                <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200 mt-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">アクセス権限がありません</h3>
                    <p className="text-gray-500">顧客管理ページを表示する権限がありません。管理者にお問い合わせください。</p>
                </div>
            </div>
        )
    }


    const customers = storeId ? await customerService.getCustomers(storeId, query) : []

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h1 className="text-3xl font-bold tracking-tight">顧客管理</h1>
                    <StoreSelector stores={stores} currentStoreId={storeId} />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                <Input 
                    type="text" 
                    placeholder="名前・電話番号で検索..." 
                    className="w-[200px] h-8 text-[13px]" 
                    defaultValue={query || ''}
                />
                <Button className="h-8 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 text-[13px] border border-gray-300">絞り込み</Button>
                
                <div className="ml-auto">
                    <Button asChild className="h-8 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold">
                        <Link href="/dashboard/customers/new">
                            <UserPlus className="mr-1 h-4 w-4" /> 顧客登録
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="text-sm text-gray-600 mb-2">
                {customers.length}件中 1-{customers.length}件 を表示
            </div>

            <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                <Table className="min-w-max">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px] text-center"><input type="checkbox" /></TableHead>
                            <TableHead>名前</TableHead>
                            <TableHead>連絡先</TableHead>
                            <TableHead className="text-center">会員状態</TableHead>
                            <TableHead className="text-center">最終来店日</TableHead>
                            <TableHead className="text-right">来店回数</TableHead>
                            <TableHead className="text-center">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.map((customer) => (
                            <TableRow key={customer.id}>
                                <TableCell className="text-center"><input type="checkbox" /></TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-sm bg-slate-100 flex items-center justify-center overflow-hidden">
                                            {customer.avatar_url ? (
                                                <img src={customer.avatar_url} alt={customer.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-medium text-slate-500">{customer.name.slice(0, 1)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-[13px] text-blue-600 font-bold">{customer.name}</div>
                                            {customer.name_kana && <div className="text-[10px] text-gray-400">{customer.name_kana}</div>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-[12px]">{customer.phone}</div>
                                    <div className="text-[11px] text-gray-400">{customer.email}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${customer.is_registered ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {customer.is_registered ? '会員' : 'ゲスト'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center text-[12px] text-gray-600">
                                    {customer.last_visit_date ? new Date(customer.last_visit_date).toLocaleDateString('ja-JP') : '-'}
                                </TableCell>
                                <TableCell className="text-right text-[12px] text-gray-600">{customer.total_visits}回</TableCell>
                                <TableCell className="text-center">
                                    <Button variant="ghost" size="sm" asChild className="h-6 text-[11px] text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                        <Link href={`/dashboard/customers/${customer.id}`}>
                                            詳細
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {customers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-gray-500 text-[13px]">
                                    顧客データが見つかりません
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
