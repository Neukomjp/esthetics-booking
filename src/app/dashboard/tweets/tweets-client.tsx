'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Send } from 'lucide-react'
import { tweetService, TweetSchedule } from '@/lib/services/marketing'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Staff } from '@/types/staff'
import { updateBlueskyCredentialsAction } from '@/lib/actions/store'

interface TweetsClientProps {
    initialSchedules: TweetSchedule[]
    storeId: string
    staffList: Staff[]
    blueskyHandle?: string | null
}

const statusLabels: Record<string, { label: string; className: string }> = {
    pending: { label: '予約中', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    sent: { label: '送信済', className: 'bg-green-100 text-green-800 border-green-200' },
    failed: { label: '失敗', className: 'bg-red-100 text-red-800 border-red-200' },
}

export function TweetsClient({ initialSchedules, storeId, staffList, blueskyHandle }: TweetsClientProps) {
    const [schedules, setSchedules] = useState<TweetSchedule[]>(initialSchedules)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
    const [scheduleToDelete, setScheduleToDelete] = useState<TweetSchedule | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isLinking, setIsLinking] = useState(false)

    // Account link state
    const [isLinked, setIsLinked] = useState(!!blueskyHandle)
    const [credentials, setCredentials] = useState({
        handle: blueskyHandle || '',
        password: ''
    })

    const [formData, setFormData] = useState({
        staff_id: 'all',
        content: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '12:00'
    })

    const handleAddClick = () => {
        setFormData({
            staff_id: 'all',
            content: '',
            scheduled_date: new Date().toISOString().split('T')[0],
            scheduled_time: '12:00'
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.content) {
            toast.error('投稿内容を入力してください')
            return
        }

        const scheduledAtStr = `${formData.scheduled_date}T${formData.scheduled_time}:00`
        const scheduledAt = new Date(scheduledAtStr)

        if (isNaN(scheduledAt.getTime())) {
            toast.error('正しい日時を入力してください')
            return
        }

        setIsLoading(true)
        try {
            const payload = {
                store_id: storeId,
                staff_id: formData.staff_id === 'all' ? null : formData.staff_id,
                content: formData.content,
                scheduled_at: scheduledAt.toISOString(),
                status: 'pending' as const
            }

            const added = await tweetService.createSchedule(payload)
            setSchedules([added, ...schedules])
            toast.success('スケジュールを追加しました')
            setIsDialogOpen(false)
        } catch (error) {
            console.error('Error saving schedule:', error)
            toast.error('保存に失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!scheduleToDelete) return
        try {
            await tweetService.deleteSchedule(scheduleToDelete.id)
            setSchedules(schedules.filter(s => s.id !== scheduleToDelete.id))
            toast.success('スケジュールを削除しました')
        } catch (error) {
            console.error('Error deleting schedule:', error)
            toast.error('削除に失敗しました')
        } finally {
            setScheduleToDelete(null)
        }
    }

    const handleLinkClick = () => {
        setIsLinkDialogOpen(true)
    }

    const handleSaveCredentials = async () => {
        if (!credentials.handle || !credentials.password) {
            toast.error('ハンドル名とアプリパスワードを入力してください')
            return
        }

        setIsLinking(true)
        try {
            await updateBlueskyCredentialsAction(storeId, credentials.handle, credentials.password)
            setIsLinked(true)
            toast.success('Blueskyアカウントを連携しました')
            setIsLinkDialogOpen(false)
        } catch (error) {
            console.error('Failed to link account:', error)
            toast.error('連携に失敗しました。時間をおいて再試行してください。')
        } finally {
            setIsLinking(false)
        }
    }

    const handleUnlink = async () => {
        setIsLinking(true)
        try {
            await updateBlueskyCredentialsAction(storeId, null, null)
            setIsLinked(false)
            setCredentials({ handle: '', password: '' })
            toast.success('Blueskyアカウントの連携を解除しました')
            setIsLinkDialogOpen(false)
        } catch (error) {
            console.error('Failed to unlink account:', error)
            toast.error('解除に失敗しました。')
        } finally {
            setIsLinking(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button 
                    onClick={handleLinkClick}
                    variant={isLinked ? "outline" : "default"}
                    className={`h-8 px-4 text-[13px] font-bold ${!isLinked ? 'bg-[#0085ff] hover:bg-[#0074e0] text-white border-none' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                >
                    <Send className="mr-2 h-4 w-4" /> 
                    {isLinked ? '連携済み (設定変更)' : 'アカウント連携'}
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                <Button onClick={handleAddClick} className="h-8 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold">
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
                                    スケジュールされた投稿はありません。
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
                                            <Button 
                                                onClick={() => setScheduleToDelete(schedule)}
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-6 text-[11px] text-red-600"
                                            >
                                                削除
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>新規スケジュール作成</DialogTitle>
                        <DialogDescription>自動投稿する内容と日時を設定します。</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[13px]">対象キャスト</Label>
                            <Select 
                                value={formData.staff_id} 
                                onValueChange={(val) => setFormData({...formData, staff_id: val})}
                            >
                                <SelectTrigger className="w-full text-[13px]">
                                    <SelectValue placeholder="選択してください" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全体（店舗アカウント）</SelectItem>
                                    {staffList.map(staff => (
                                        <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[13px]">投稿予定日時</Label>
                            <div className="flex gap-2">
                                <Input 
                                    type="date" 
                                    className="text-[13px] flex-1"
                                    value={formData.scheduled_date}
                                    onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                                />
                                <Input 
                                    type="time" 
                                    className="text-[13px] flex-1"
                                    value={formData.scheduled_time}
                                    onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[13px]">投稿内容 <span className="text-red-500">*</span></Label>
                            <Textarea 
                                className="w-full min-h-[120px] text-[13px]"
                                placeholder="投稿内容を入力..."
                                value={formData.content}
                                onChange={(e) => setFormData({...formData, content: e.target.value})}
                            />
                            <div className="text-[11px] text-gray-500 text-right">
                                ※残り文字数: {300 - formData.content.length}文字
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading} className="text-[13px]">
                            キャンセル
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading} className="text-[13px] bg-[#4CAF50] hover:bg-[#45a049] text-white">
                            {isLoading ? '保存中...' : 'スケジュールする'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Account Link Dialog */}
            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Blueskyアカウント連携</DialogTitle>
                        <DialogDescription>
                            自動投稿を行うためのBlueskyアカウント情報を設定します。セキュリティのため、通常のパスワードではなく「アプリパスワード（App Password）」をご利用ください。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[13px]">ハンドル名</Label>
                            <Input 
                                placeholder="例: shop.bsky.social" 
                                value={credentials.handle}
                                onChange={(e) => setCredentials({...credentials, handle: e.target.value})}
                                className="text-[13px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[13px]">アプリパスワード</Label>
                            <Input 
                                type="password" 
                                placeholder="xxxx-xxxx-xxxx-xxxx" 
                                value={credentials.password}
                                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                                className="text-[13px]"
                            />
                            <div className="text-[11px] text-gray-500">
                                Blueskyの「設定」＞「高度な設定」＞「アプリパスワード」から生成できます。
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex justify-between items-center w-full sm:justify-between">
                        {isLinked ? (
                            <Button 
                                variant="destructive" 
                                onClick={handleUnlink} 
                                disabled={isLinking} 
                                className="text-[13px]"
                            >
                                {isLinking ? '処理中...' : '連携を解除'}
                            </Button>
                        ) : (
                            <div /> // Placeholder for spacing
                        )}
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)} disabled={isLinking} className="text-[13px]">
                                キャンセル
                            </Button>
                            <Button onClick={handleSaveCredentials} disabled={isLinking} className="text-[13px] bg-[#0085ff] hover:bg-[#0074e0] text-white">
                                {isLinking ? '保存中...' : '連携する'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!scheduleToDelete} onOpenChange={(open) => !open && setScheduleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>スケジュールの削除</AlertDialogTitle>
                        <AlertDialogDescription>
                            この投稿スケジュールを削除しますか？送信前の場合は投稿されません。
                        </AlertDialogDescription>
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
