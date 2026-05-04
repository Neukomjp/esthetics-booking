'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useCurrentOrganization } from '@/hooks/use-current-organization'
import { canViewPayments } from '@/lib/rbac'
import { Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getStoresAction } from '@/lib/actions/store'
import {
    getDashboardSalesSummaryAction,
    getRecentTransactionsAction,
    DashboardSalesSummary,
    RecentTransaction
} from '@/lib/actions/sales'

export default function PaymentsPage() {
    const { organization, loading: orgLoading } = useCurrentOrganization()
    const [salesSummary, setSalesSummary] = useState<DashboardSalesSummary | null>(null)
    const [recentTx, setRecentTx] = useState<RecentTransaction[]>([])
    const [fetching, setFetching] = useState(true)

    useEffect(() => {
        if (!organization) return

        const fetchData = async () => {
            try {
                const stores = await getStoresAction()
                if (stores && stores.length > 0) {
                    const storeId = stores[0].id
                    const [summaryData, txData] = await Promise.all([
                        getDashboardSalesSummaryAction(storeId),
                        getRecentTransactionsAction(storeId)
                    ])
                    setSalesSummary(summaryData)
                    setRecentTx(txData)
                }
            } catch (error) {
                console.error("Failed to fetch payments data", error)
            } finally {
                setFetching(false)
            }
        }

        fetchData()
    }, [organization])

    if (orgLoading || (fetching && organization)) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        )
    }

    if (organization && !canViewPayments(organization.role)) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200 mt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">アクセス権限がありません</h3>
                <p className="text-gray-500">決済・売上ページを表示する権限がありません。管理者にお問い合わせください。</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">決済・売上レポート</h2>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div className="bg-white border border-gray-200 p-3 rounded-md shadow-sm">
                    <div className="text-[12px] text-gray-500 mb-1">本日の売上</div>
                    <div className="text-xl font-bold text-red-600">¥{salesSummary?.todaySales.toLocaleString() || 0}</div>
                </div>
                <div className="bg-white border border-gray-200 p-3 rounded-md shadow-sm">
                    <div className="text-[12px] text-gray-500 mb-1">決済回数</div>
                    <div className="text-xl font-bold text-blue-600">{salesSummary?.transactionCount || 0}回</div>
                </div>
                <div className="bg-white border border-gray-200 p-3 rounded-md shadow-sm">
                    <div className="text-[12px] text-gray-500 mb-1">平均客単価</div>
                    <div className="text-xl font-bold text-green-600">¥{salesSummary?.averageTicket.toLocaleString() || 0}</div>
                </div>
            </div>

            <div className="text-sm text-gray-600 mb-2">
                決済履歴 ({recentTx.length}件)
            </div>

            <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                <Table className="min-w-max">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">日時</TableHead>
                            <TableHead>決済方法</TableHead>
                            <TableHead className="text-right">金額</TableHead>
                            <TableHead className="text-center">ステータス</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentTx.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-gray-500 text-[13px] py-8">
                                    決済履歴がありません
                                </TableCell>
                            </TableRow>
                        ) : (
                            recentTx.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="text-[12px] text-gray-600">{tx.date}</TableCell>
                                    <TableCell className="text-[13px]">{tx.method}</TableCell>
                                    <TableCell className="text-right font-medium text-red-600 text-[13px]">¥{tx.amount.toLocaleString()}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={`font-normal text-[11px] px-2 py-0 h-5 ${tx.status === 'Success' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {tx.status === 'Success' ? '成功' : '失敗'}
                                        </Badge>
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
