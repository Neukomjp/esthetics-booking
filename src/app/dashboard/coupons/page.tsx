import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StoreSelector } from '@/app/dashboard/bookings/store-selector'
import { Input } from '@/components/ui/input'
import { getCouponsAction } from '@/lib/actions/coupon'
import { getStoresAction } from '@/lib/actions/store'
import { CouponToggle } from './coupon-toggle'
import { cookies } from 'next/headers'
import { canViewCoupons } from '@/lib/rbac'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function CouponsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const stores = await getStoresAction()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchParams = await props.searchParams;
    const urlStoreId = searchParams.store as string | undefined;
    const storeId = urlStoreId && stores.find(s => s.id === urlStoreId) ? urlStoreId : (stores.length > 0 ? stores[0].id : '')

    const cookieStore = await cookies()
    const orgId = cookieStore.get('organization-id')?.value

    let hasAccess = false
    if (orgId) {
        const { getUserOrganizationsAction } = await import('@/lib/actions/organization')
        const orgs = await getUserOrganizationsAction()
        const currentOrg = orgs.find(o => o.id === orgId) || orgs[0]
        hasAccess = currentOrg ? canViewCoupons(currentOrg.role as any) : false
    } else {
        // Fallback or demo
        hasAccess = true;
    }

    if (!hasAccess) {
        return (
            <div className="space-y-6">
                <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200 mt-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">アクセス権限がありません</h3>
                    <p className="text-gray-500">クーポン管理ページを表示する権限がありません。管理者にお問い合わせください。</p>
                </div>
            </div>
        )
    }

    const coupons = storeId ? await getCouponsAction(storeId) : []

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">クーポン管理</h2>
                    <StoreSelector stores={stores} currentStoreId={storeId} />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                <Input 
                    type="text" 
                    placeholder="クーポン名で検索..." 
                    className="w-[200px] h-8 text-[13px]" 
                />
                <Button className="h-8 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 text-[13px] border border-gray-300">絞り込み</Button>
                
                <div className="ml-auto">
                    <Button asChild className="h-8 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold">
                        <Link href="/dashboard/coupons/new">
                            <Plus className="mr-1 h-4 w-4" /> クーポン作成
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="text-sm text-gray-600 mb-2">
                {coupons.length}件中 1-{coupons.length}件 を表示
            </div>

            <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                <Table className="min-w-max">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px] text-center"><input type="checkbox" /></TableHead>
                            <TableHead>クーポン名・コード</TableHead>
                            <TableHead className="text-right">割引内容</TableHead>
                            <TableHead className="text-center">有効期限</TableHead>
                            <TableHead className="text-center">ステータス</TableHead>
                            <TableHead className="text-center">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {coupons.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-gray-500 py-8 text-[13px]">
                                    クーポンがありません。新しいクーポンを作成して集客に活用しましょう。
                                </TableCell>
                            </TableRow>
                        ) : (
                            coupons.map((coupon) => (
                                <TableRow key={coupon.id} className={coupon.is_active ? '' : 'bg-gray-50 opacity-70'}>
                                    <TableCell className="text-center"><input type="checkbox" /></TableCell>
                                    <TableCell>
                                        <div className="font-bold text-blue-600 text-[13px]">{coupon.name}</div>
                                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">{coupon.code}</div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-red-600 text-[13px]">
                                        {coupon.discount_type === 'fixed'
                                            ? `¥${coupon.discount_amount.toLocaleString()} OFF`
                                            : `${coupon.discount_amount}% OFF`}
                                    </TableCell>
                                    <TableCell className="text-center text-[12px] text-gray-600">
                                        {new Date(coupon.expires_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={`font-normal text-[11px] px-2 py-0 h-5 ${coupon.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                            {coupon.is_active ? '有効' : '停止中'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <CouponToggle id={coupon.id} isActive={coupon.is_active} />
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
