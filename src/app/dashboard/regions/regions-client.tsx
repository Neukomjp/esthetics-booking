'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { regionService, Region } from '@/lib/services/regions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'

interface RegionsClientProps {
    initialRegions: Region[]
    organizationId: string
}

export function RegionsClient({ initialRegions, organizationId }: RegionsClientProps) {
    const [regions, setRegions] = useState<Region[]>(initialRegions)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingRegion, setEditingRegion] = useState<Region | null>(null)
    const [regionToDelete, setRegionToDelete] = useState<Region | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    })

    const handleAddClick = () => {
        setEditingRegion(null)
        setFormData({ name: '', description: '' })
        setIsDialogOpen(true)
    }

    const handleEditClick = (region: Region) => {
        setEditingRegion(region)
        setFormData({
            name: region.name,
            description: region.description || ''
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('エリア名を入力してください')
            return
        }

        setIsLoading(true)
        try {
            if (editingRegion) {
                const updated = await regionService.updateRegion(editingRegion.id, {
                    name: formData.name,
                    description: formData.description
                })
                // Preserve store_count which might not be returned by update
                updated.store_count = editingRegion.store_count
                setRegions(regions.map(r => r.id === updated.id ? updated : r))
                toast.success('エリアを更新しました')
            } else {
                const added = await regionService.createRegion(organizationId, formData.name, formData.description)
                added.store_count = 0
                setRegions([...regions, added])
                toast.success('エリアを作成しました')
            }
            setIsDialogOpen(false)
        } catch (error) {
            console.error('Error saving region:', error)
            toast.error('保存に失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!regionToDelete) return
        try {
            await regionService.deleteRegion(regionToDelete.id)
            setRegions(regions.filter(r => r.id !== regionToDelete.id))
            toast.success('エリアを削除しました')
        } catch (error) {
            console.error('Error deleting region:', error)
            toast.error('削除に失敗しました。店舗が紐づいている可能性があります。')
        } finally {
            setRegionToDelete(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                <Button onClick={handleAddClick} className="h-8 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold">
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
                                            <button onClick={() => handleEditClick(region)} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => setRegionToDelete(region)} className="text-red-600 hover:bg-red-50 p-1 rounded">
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
                        <DialogTitle>{editingRegion ? 'エリアの編集' : '新規エリアを作成'}</DialogTitle>
                        <DialogDescription>
                            エリアの名前と説明を入力してください。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right text-[13px]">エリア名 <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="col-span-3 text-[13px]"
                                placeholder="例: 関東エリア, 東京"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right pt-2 text-[13px]">説明</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="col-span-3 text-[13px]"
                                placeholder="エリアの詳細など（任意）"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading} className="text-[13px]">
                            キャンセル
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading} className="text-[13px] bg-[#4CAF50] hover:bg-[#45a049] text-white">
                            {isLoading ? '保存中...' : '保存する'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!regionToDelete} onOpenChange={(open) => !open && setRegionToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>削除の確認</AlertDialogTitle>
                        <AlertDialogDescription>「{regionToDelete?.name}」を削除しますか？この操作は取り消せません。</AlertDialogDescription>
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
