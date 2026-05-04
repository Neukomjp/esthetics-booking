'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Store, ExternalLink, Edit, Loader2, Users } from 'lucide-react'
import { getStoresAction } from '@/lib/actions/store'
import { StoreData } from '@/lib/types/store'
import { toast } from 'sonner'
import { useCurrentOrganization } from '@/hooks/use-current-organization'
import { canCreateStore, canViewStores } from '@/lib/rbac'

export default function StoresPage() {
    const [stores, setStores] = useState<StoreData[]>([])
    const [loading, setLoading] = useState(true)
    const [isDemo, setIsDemo] = useState(false)
    const { organization, loading: orgLoading } = useCurrentOrganization()

    useEffect(() => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
            setIsDemo(true)
        }
        loadStores()
    }, [])

    async function loadStores() {
        try {
            const data = await getStoresAction()
            setStores(data || [])
        } catch (error) {
            console.error('Failed to fetch stores:', error)
            toast.error(`店舗の取得に失敗しました: ${(error as Error).message || 'Unknown error'}`)
            setStores([]) // Clear stores on error
        } finally {
            setLoading(false)
        }
    }

    if (loading || orgLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        )
    }

    if (organization && !canViewStores(organization.role)) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200 mt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">アクセス権限がありません</h3>
                <p className="text-gray-500">店舗管理ページを表示する権限がありません。管理者にお問い合わせください。</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {isDemo && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Store className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                <span className="font-bold">Demo Mode Active:</span> You are viewing mock data because Supabase is not configured.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">店舗管理</h2>
                </div>
                {organization && canCreateStore(organization.role) && (
                    <Button asChild className="h-8 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold">
                        <Link href="/dashboard/stores/new" className="flex items-center">
                            <Plus className="mr-2 h-4 w-4" /> 新規店舗作成
                        </Link>
                    </Button>
                )}
            </div>

            <div className="text-sm text-gray-600 mb-2">
                {stores.length}件中 1-{stores.length}件 を表示
            </div>

            <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                <Table className="min-w-[600px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px] text-center"><input type="checkbox" /></TableHead>
                            <TableHead>店舗名</TableHead>
                            <TableHead>スラッグ (URL)</TableHead>
                            <TableHead className="text-center">ステータス</TableHead>
                            <TableHead className="text-center">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stores.map((store) => (
                            <TableRow key={store.id}>
                                <TableCell className="text-center"><input type="checkbox" /></TableCell>
                                <TableCell className="font-medium text-blue-600 text-[13px]">
                                    <div className="flex items-center gap-2">
                                        <Store className="h-4 w-4 text-gray-400" />
                                        {store.name}
                                    </div>
                                </TableCell>
                                <TableCell className="text-[12px] text-gray-600">/{store.slug}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={`font-normal text-[11px] px-2 py-0 h-5 ${store.is_published ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                        {store.is_published ? '公開中' : '下書き'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Button variant="ghost" size="sm" asChild className="h-6 text-[11px] text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                            <Link href={`/dashboard/stores/${store.id}`}>
                                                <Edit className="mr-1 h-3 w-3" /> 設定・詳細
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="sm" asChild className="h-6 text-[11px] text-gray-600 hover:text-gray-800 hover:bg-gray-100">
                                            <Link href={`/store/${store.slug}`} target="_blank">
                                                <ExternalLink className="mr-1 h-3 w-3" /> ページ確認
                                            </Link>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {stores.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-gray-500 text-[13px]">
                                    店舗が見つかりません。
                                    {organization && canCreateStore(organization.role) && (
                                        <div className="mt-2">
                                            <Button variant="outline" size="sm" asChild className="text-[12px]">
                                                <Link href="/dashboard/stores/new">
                                                    最初の店舗を作成する
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
