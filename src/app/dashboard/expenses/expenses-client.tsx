'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { expenseService, Expense } from '@/lib/services/expenses'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface ExpensesClientProps {
    initialExpenses: Expense[]
    storeId: string
    initialMonthlyTotal: number
}

const categoryLabels: Record<string, string> = {
    supplies: '消耗品費',
    rent: '家賃',
    utilities: '水道光熱費',
    transport: '交通費',
    advertising: '広告宣伝費',
    other: 'その他',
}

export function ExpensesClient({ initialExpenses, storeId, initialMonthlyTotal }: ExpensesClientProps) {
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
    const [monthlyTotal, setMonthlyTotal] = useState(initialMonthlyTotal)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    
    // Filtering
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    const [formData, setFormData] = useState({
        expense_date: new Date().toISOString().split('T')[0],
        category: 'supplies',
        amount: '',
        description: ''
    })

    const handleFilter = async () => {
        try {
            const data = await expenseService.getExpenses(storeId, startDate || undefined, endDate || undefined)
            setExpenses(data)
        } catch (error) {
            console.error(error)
            toast.error('経費データの取得に失敗しました')
        }
    }

    const handleEditClick = (expense: Expense) => {
        setEditingExpense(expense)
        setFormData({
            expense_date: expense.expense_date,
            category: expense.category,
            amount: expense.amount.toString(),
            description: expense.description || ''
        })
        setIsDialogOpen(true)
    }

    const handleAddNewClick = () => {
        setEditingExpense(null)
        setFormData({
            expense_date: new Date().toISOString().split('T')[0],
            category: 'supplies',
            amount: '',
            description: ''
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.amount || isNaN(Number(formData.amount))) {
            toast.error('正しい金額を入力してください')
            return
        }

        setIsLoading(true)
        try {
            const payload = {
                store_id: storeId,
                expense_date: formData.expense_date,
                category: formData.category,
                amount: Number(formData.amount),
                description: formData.description,
                created_by: null // handled by DB or just omit if not strict
            }

            if (editingExpense) {
                const updated = await expenseService.updateExpense(editingExpense.id, payload)
                setExpenses(expenses.map(e => e.id === updated.id ? updated : e))
                toast.success('経費を更新しました')
            } else {
                const added = await expenseService.createExpense(payload)
                // If it's in the filtered range or no filter, add to list. For simplicity, just refetch
                handleFilter()
                toast.success('経費を登録しました')
            }
            
            // Refetch total
            const total = await expenseService.getMonthlyTotal(storeId)
            setMonthlyTotal(total)
            
            setIsDialogOpen(false)
        } catch (error) {
            console.error(error)
            toast.error('保存に失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!expenseToDelete) return
        try {
            await expenseService.deleteExpense(expenseToDelete.id)
            setExpenses(expenses.filter(e => e.id !== expenseToDelete.id))
            toast.success('経費を削除しました')
            
            const total = await expenseService.getMonthlyTotal(storeId)
            setMonthlyTotal(total)
        } catch (error) {
            console.error(error)
            toast.error('削除に失敗しました')
        } finally {
            setExpenseToDelete(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                <Input 
                    type="date" 
                    className="w-[150px] h-8 text-[13px]" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-gray-500">〜</span>
                <Input 
                    type="date" 
                    className="w-[150px] h-8 text-[13px]" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
                <Button 
                    onClick={handleFilter}
                    className="h-8 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 text-[13px] border border-gray-300"
                >
                    絞り込み
                </Button>
                
                <div className="ml-auto">
                    <Button onClick={handleAddNewClick} className="h-8 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold">
                        <Plus className="mr-1 h-4 w-4" /> 経費を登録
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
                <div className="bg-white border border-gray-200 p-3 rounded-md shadow-sm">
                    <div className="text-[12px] text-gray-500 mb-1">今月の経費合計</div>
                    <div className="text-xl font-bold text-red-600">¥{monthlyTotal.toLocaleString()}</div>
                </div>
                <div className="bg-white border border-gray-200 p-3 rounded-md shadow-sm">
                    <div className="text-[12px] text-gray-500 mb-1">経費件数</div>
                    <div className="text-xl font-bold text-blue-600">{expenses.length}件</div>
                </div>
            </div>

            <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                <Table className="min-w-max">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">日付</TableHead>
                            <TableHead className="w-[150px]">勘定科目</TableHead>
                            <TableHead>摘要・詳細</TableHead>
                            <TableHead className="text-right w-[150px]">金額</TableHead>
                            <TableHead className="text-center w-[100px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-500 py-8 text-[13px]">
                                    経費データが登録されていません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            expenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell className="text-[13px]">{expense.expense_date}</TableCell>
                                    <TableCell className="text-[13px]">{categoryLabels[expense.category] || expense.category}</TableCell>
                                    <TableCell className="text-[13px]">{expense.description || '-'}</TableCell>
                                    <TableCell className="text-right font-medium text-red-600 text-[13px]">¥{expense.amount.toLocaleString()}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleEditClick(expense)} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => setExpenseToDelete(expense)} className="text-red-600 hover:bg-red-50 p-1 rounded">
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingExpense ? '経費を編集' : '経費を登録'}</DialogTitle>
                        <DialogDescription>経費の情報を入力してください</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-[13px]">日付</Label>
                            <Input 
                                type="date"
                                className="col-span-3 text-[13px]"
                                value={formData.expense_date}
                                onChange={e => setFormData({...formData, expense_date: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-[13px]">勘定科目</Label>
                            <Select 
                                value={formData.category} 
                                onValueChange={val => setFormData({...formData, category: val})}
                            >
                                <SelectTrigger className="col-span-3 text-[13px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(categoryLabels).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-[13px]">金額 (¥)</Label>
                            <Input 
                                type="number"
                                className="col-span-3 text-[13px]"
                                value={formData.amount}
                                onChange={e => setFormData({...formData, amount: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right text-[13px] mt-2">摘要</Label>
                            <textarea 
                                className="col-span-3 min-h-[80px] text-[13px] flex w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="摘要・詳細を入力"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-[13px]">キャンセル</Button>
                        <Button onClick={handleSave} disabled={isLoading} className="text-[13px] bg-[#4CAF50] hover:bg-[#45a049] text-white">
                            {isLoading ? '保存中...' : '保存する'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>削除の確認</AlertDialogTitle>
                        <AlertDialogDescription>この経費データを削除しますか？この操作は取り消せません。</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">削除する</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
