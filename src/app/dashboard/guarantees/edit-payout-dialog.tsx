'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { DailyPayout } from '@/lib/services/payouts'
import { updatePayoutAction } from '@/lib/actions/erp'

interface EditPayoutDialogProps {
    payout: DailyPayout | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function EditPayoutDialog({ payout, isOpen, onOpenChange, onSuccess }: EditPayoutDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!payout) return null

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)
        const baseAmount = parseInt(formData.get('base_amount') as string, 10)
        const backAmount = parseInt(formData.get('back_amount') as string, 10)
        const deductionAmount = parseInt(formData.get('deduction_amount') as string, 10)
        const deductionReason = formData.get('deduction_reason') as string

        try {
            await updatePayoutAction(payout.id, {
                base_amount: isNaN(baseAmount) ? 0 : baseAmount,
                back_amount: isNaN(backAmount) ? 0 : backAmount,
                deduction_amount: isNaN(deductionAmount) ? 0 : deductionAmount,
                deduction_reason: deductionReason || null
            })
            
            toast.success('給与データを更新しました')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to update payout:', error)
            toast.error('給与データの更新に失敗しました')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{payout.staff?.name}さんの給与編集</DialogTitle>
                    <DialogDescription>金額を直接変更できます。支給総額は自動的に再計算されます。</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="base_amount">基本給・日給保証 (円)</Label>
                        <Input 
                            id="base_amount" 
                            name="base_amount" 
                            type="number" 
                            defaultValue={payout.base_amount || 0} 
                            min="0"
                            required 
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="back_amount">指名・歩合給 (円)</Label>
                        <Input 
                            id="back_amount" 
                            name="back_amount" 
                            type="number" 
                            defaultValue={payout.back_amount || 0} 
                            min="0"
                            required 
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="deduction_amount">控除・雑費等 (円)</Label>
                            <Input 
                                id="deduction_amount" 
                                name="deduction_amount" 
                                type="number" 
                                defaultValue={payout.deduction_amount || 0} 
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deduction_reason">控除理由</Label>
                            <Input 
                                id="deduction_reason" 
                                name="deduction_reason" 
                                placeholder="例: 遅刻、備品代"
                                defaultValue={payout.deduction_reason || ''} 
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            キャンセル
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? '保存中...' : '保存する'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
