'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calculator, Download } from 'lucide-react'
import { DailyPayout } from '@/lib/services/payouts'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { calculatePayoutsAction, markPayoutAsPaidAction } from '@/lib/actions/erp'
import { EditPayoutDialog } from './edit-payout-dialog'

interface GuaranteesClientProps {
    initialPayouts: DailyPayout[]
    storeId: string
    targetDate: string
}

export function GuaranteesClient({ initialPayouts, storeId, targetDate }: GuaranteesClientProps) {
    const [payouts, setPayouts] = useState<DailyPayout[]>(initialPayouts)
    const [isCalculating, setIsCalculating] = useState(false)
    const [currentDate, setCurrentDate] = useState(targetDate)
    const [editingPayout, setEditingPayout] = useState<DailyPayout | null>(null)
    const router = useRouter()
    
    useEffect(() => {
        setPayouts(initialPayouts)
        setCurrentDate(targetDate)
    }, [initialPayouts, targetDate])

    const totalPayout = payouts.reduce((sum, p) => sum + (p.total_amount || 0), 0)

    const handleDateChange = () => {
        router.push(`/dashboard/guarantees?date=${currentDate}${storeId ? `&store=${storeId}` : ''}`)
    }

    const handleCalculate = async () => {
        setIsCalculating(true)
        try {
            const updatedPayouts = await calculatePayoutsAction(storeId, currentDate)
            setPayouts(updatedPayouts)
            toast.success(`${currentDate} の給与計算が完了しました`)
        } catch (error) {
            console.error('Failed to calculate payouts:', error)
            toast.error('計算処理に失敗しました')
        } finally {
            setIsCalculating(false)
        }
    }

    const handleMarkAsPaid = async (payout: DailyPayout) => {
        if (payout.is_paid) return
        try {
            await markPayoutAsPaidAction(payout.id)
            setPayouts(payouts.map(p => p.id === payout.id ? { ...p, is_paid: true } : p))
            toast.success('支払済としてマークしました')
        } catch (error) {
            console.error('Failed to mark as paid:', error)
            toast.error('状態の更新に失敗しました')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                <Input 
                    type="date" 
                    className="w-[150px] h-8 text-[13px]" 
                    value={currentDate}
                    onChange={(e) => setCurrentDate(e.target.value)}
                />
                <Button 
                    onClick={handleDateChange} 
                    className="h-8 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 text-[13px] border border-gray-300"
                >
                    対象日変更
                </Button>
                
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" className="h-8 px-4 text-[13px]" onClick={() => toast.info('CSVダウンロードは準備中です')}>
                        <Download className="mr-1 h-4 w-4" /> CSVエクスポート
                    </Button>
                    <Button 
                        onClick={handleCalculate} 
                        disabled={isCalculating}
                        className="h-8 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold"
                    >
                        <Calculator className="mr-1 h-4 w-4" /> 
                        {isCalculating ? '計算中...' : '本日の給与計算を実行'}
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
                            <TableHead className="text-center w-[120px]">操作</TableHead>
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
                                    <TableCell className="text-center space-x-2">
                                        {!payout.is_paid && (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-6 text-[11px] text-green-600"
                                                onClick={() => handleMarkAsPaid(payout)}
                                            >
                                                支払済にする
                                            </Button>
                                        )}
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 text-[11px] text-blue-600"
                                            onClick={() => setEditingPayout(payout)}
                                        >
                                            編集
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <EditPayoutDialog 
                payout={editingPayout}
                isOpen={!!editingPayout}
                onOpenChange={(open) => !open && setEditingPayout(null)}
                onSuccess={() => {
                    // Update the local state to reflect the changes
                    // Ideally we should re-fetch from DB, but we can do a hard refresh or update the local object.
                    // For simplicity, we can just let revalidatePath handle it, but wait, this is client side.
                    // Let's trigger a full refresh to get the latest DB state:
                    router.refresh()
                }}
            />
        </div>
    )
}
