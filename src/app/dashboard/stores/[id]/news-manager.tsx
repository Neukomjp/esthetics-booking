'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Trash2, CalendarIcon } from 'lucide-react'
import { News, newsService } from '@/lib/services/news'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/image-upload'

interface NewsManagerProps {
    storeId: string
}

export function NewsManager({ storeId }: NewsManagerProps) {
    const [newsList, setNewsList] = useState<News[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingNews, setEditingNews] = useState<News | null>(null)
    const [newsToDelete, setNewsToDelete] = useState<News | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        image_url: '',
        url: '',
        is_published: true,
        published_at: new Date().toISOString().slice(0, 16)
    })

    useEffect(() => {
        loadNews()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storeId])

    useEffect(() => {
        if (!isDialogOpen) {
            setEditingNews(null)
            setFormData({
                title: '',
                content: '',
                image_url: '',
                url: '',
                is_published: true,
                published_at: new Date().toISOString().slice(0, 16)
            })
        }
    }, [isDialogOpen])

    async function loadNews() {
        try {
            const data = await newsService.getNewsByStoreId(storeId)
            setNewsList(data)
        } catch (error) {
            console.error('Error loading news:', error)
            toast.error('お知らせの取得に失敗しました')
        }
    }

    const handleEditClick = (news: News) => {
        setEditingNews(news)
        setFormData({
            title: news.title,
            content: news.content || '',
            image_url: news.image_url || '',
            url: news.url || '',
            is_published: news.is_published,
            published_at: new Date(news.published_at).toISOString().slice(0, 16)
        })
        setIsDialogOpen(true)
    }

    const handleSaveNews = async () => {
        if (!formData.title) {
            toast.error('タイトルは必須です')
            return
        }

        setIsLoading(true)
        try {
            const dateObj = new Date(formData.published_at)
            
            if (editingNews) {
                const updated = await newsService.updateNews(editingNews.id, {
                    title: formData.title,
                    content: formData.content || undefined,
                    image_url: formData.image_url || undefined,
                    url: formData.url || undefined,
                    is_published: formData.is_published,
                    published_at: dateObj.toISOString()
                })
                setNewsList(newsList.map(n => n.id === updated.id ? updated : n))
                toast.success('お知らせを更新しました')
            } else {
                const added = await newsService.addNews({
                    store_id: storeId,
                    title: formData.title,
                    content: formData.content || undefined,
                    image_url: formData.image_url || undefined,
                    url: formData.url || undefined,
                    is_published: formData.is_published,
                    published_at: dateObj.toISOString()
                })
                setNewsList([added, ...newsList])
                toast.success('お知らせを追加しました')
            }
            setIsDialogOpen(false)
        } catch (error) {
            console.error('Error saving news:', error)
            toast.error('保存に失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteNewsConfirm = async () => {
        if (!newsToDelete) return
        try {
            await newsService.deleteNews(newsToDelete.id)
            setNewsList(newsList.filter(n => n.id !== newsToDelete.id))
            toast.success('お知らせを削除しました')
        } catch (error) {
            console.error('Error deleting news:', error)
            toast.error('削除に失敗しました')
        } finally {
            setNewsToDelete(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> 新規作成</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {newsList.map((news) => (
                    <Card key={news.id} className={news.is_published ? '' : 'opacity-60 bg-gray-50'}>
                        {news.image_url && (
                             <div 
                                className="h-40 w-full bg-cover bg-center rounded-t-lg" 
                                style={{ backgroundImage: `url(${news.image_url})` }}
                             />
                        )}
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base line-clamp-2">{news.title}</CardTitle>
                            </div>
                            <CardDescription className="flex items-center text-xs mt-1">
                                <CalendarIcon className="mr-1 h-3 w-3" />
                                {new Date(news.published_at).toLocaleDateString('ja-JP')}
                                {!news.is_published && <span className="ml-2 text-red-500 font-bold">[非公開]</span>}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 line-clamp-3 mb-4">{news.content || '詳細なし'}</p>
                            <div className="flex space-x-2">
                                <Button variant="outline" size="sm" className="w-full" onClick={() => handleEditClick(news)}>
                                    編集
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => setNewsToDelete(news)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {newsList.length === 0 && (
                     <div className="col-span-full text-center py-10 text-gray-500">
                         お知らせはまだ登録されていません
                     </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingNews ? 'お知らせの編集' : '新しいお知らせを追加'}</DialogTitle>
                        <DialogDescription>
                            店舗ページに表示されるInformationを作成します。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                        <div className="flex flex-col gap-2">
                            <Label>画像</Label>
                            <ImageUpload
                                value={formData.image_url}
                                onChange={(url) => setFormData({ ...formData, image_url: url })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="title">タイトル <span className="text-red-500">*</span></Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="例: 営業時間変更のお知らせ"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="content">内容</Label>
                            <textarea
                                id="content"
                                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="お知らせの詳細文..."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="url">リンクURL (該当ページがある場合)</Label>
                            <Input
                                id="url"
                                type="url"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="published_at">公開日時</Label>
                            <Input
                                id="published_at"
                                type="datetime-local"
                                value={formData.published_at}
                                onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center space-x-2 mt-2">
                            <input
                                type="checkbox"
                                id="is_published"
                                checked={formData.is_published}
                                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="is_published" className="text-sm cursor-pointer">
                                公開する
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveNews} disabled={isLoading}>
                            {isLoading ? '保存中...' : '保存する'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!newsToDelete} onOpenChange={(open) => !open && setNewsToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                            「{newsToDelete?.title}」を削除します。この操作は取り消せません。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteNewsConfirm} className="bg-red-500 hover:bg-red-600 text-white">
                            削除する
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
