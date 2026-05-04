'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Service } from '@/types/staff'
import { Edit, Trash2, Plus } from 'lucide-react'
import { menuService } from '@/lib/services/menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/image-upload'

interface ServiceListProps {
    initialServices: Service[]
    storeId: string
}

export function ServiceList({ initialServices, storeId }: ServiceListProps) {
    const [services, setServices] = useState<Service[]>(initialServices)
    const [searchTerm, setSearchTerm] = useState('')
    
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingService, setEditingService] = useState<Service | null>(null)
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        category: '',
        duration: '60',
        bufferBefore: '',
        bufferAfter: '',
        imageUrl: '',
        orderIndex: ''
    })

    const filtered = services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const handleAddClick = () => {
        setEditingService(null)
        setFormData({
            name: '', price: '', description: '', category: '', duration: '60',
            bufferBefore: '', bufferAfter: '', imageUrl: '', orderIndex: ''
        })
        setIsDialogOpen(true)
    }

    const handleEditClick = (service: Service) => {
        setEditingService(service)
        setFormData({
            name: service.name,
            price: service.price.toString(),
            description: service.description || '',
            category: service.category || '',
            duration: service.duration_minutes.toString(),
            bufferBefore: service.buffer_time_before?.toString() || '',
            bufferAfter: service.buffer_time_after?.toString() || '',
            imageUrl: service.image_url || '',
            orderIndex: service.order_index?.toString() || ''
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name || !formData.price || isNaN(Number(formData.price))) {
            toast.error('必須項目を正しく入力してください')
            return
        }

        setIsLoading(true)
        try {
            const payload = {
                store_id: storeId,
                name: formData.name,
                price: Number(formData.price),
                description: formData.description,
                category: formData.category,
                duration_minutes: Number(formData.duration) || 60,
                buffer_time_before: Number(formData.bufferBefore) || 0,
                buffer_time_after: Number(formData.bufferAfter) || 0,
                image_url: formData.imageUrl,
                order_index: formData.orderIndex ? Number(formData.orderIndex) : 0
            }

            if (editingService) {
                const updated = await menuService.updateService(editingService.id, payload)
                setServices(services.map(s => s.id === updated.id ? updated : s))
                toast.success('コースを更新しました')
            } else {
                const added = await menuService.addService(payload)
                setServices([added, ...services])
                toast.success('コースを追加しました')
            }
            setIsDialogOpen(false)
        } catch (error) {
            console.error('Error saving service:', error)
            toast.error('保存に失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!serviceToDelete) return
        try {
            await menuService.deleteService(serviceToDelete.id)
            setServices(services.filter(s => s.id !== serviceToDelete.id))
            toast.success('コースを削除しました')
        } catch (error) {
            console.error('Error deleting service:', error)
            toast.error('削除に失敗しました')
        } finally {
            setServiceToDelete(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                <Input 
                    type="text" 
                    placeholder="コース名で検索..." 
                    className="w-[200px] h-8 text-[13px]" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button className="h-8 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 text-[13px] border border-gray-300">絞り込み</Button>
                
                <div className="ml-auto">
                    <Button onClick={handleAddClick} className="h-8 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold">
                        <Plus className="mr-1 h-4 w-4" /> コースを追加
                    </Button>
                </div>
            </div>

            <div className="text-sm text-gray-600 mb-2">
                {filtered.length}件中 1-{filtered.length}件 を表示
            </div>

            <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                <Table className="min-w-max">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px] text-center"><input type="checkbox" /></TableHead>
                            <TableHead>コース名</TableHead>
                            <TableHead className="text-right">時間 (分)</TableHead>
                            <TableHead className="text-right">料金 (円)</TableHead>
                            <TableHead className="text-center">表示順</TableHead>
                            <TableHead className="text-center">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((service) => (
                            <TableRow key={service.id}>
                                <TableCell className="text-center"><input type="checkbox" /></TableCell>
                                <TableCell className="font-bold text-blue-600 text-[13px]">
                                    {service.name}
                                    {service.description && <div className="text-[11px] text-gray-400 font-normal mt-0.5 max-w-[300px] truncate">{service.description}</div>}
                                </TableCell>
                                <TableCell className="text-right text-[12px]">{service.duration_minutes}分</TableCell>
                                <TableCell className="text-right font-medium text-red-600 text-[13px]">¥{service.price.toLocaleString()}</TableCell>
                                <TableCell className="text-center text-[12px] text-gray-500">{service.order_index}</TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => handleEditClick(service)} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => setServiceToDelete(service)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-gray-500 text-[13px]">
                                    コースが登録されていません。
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingService ? 'コースの編集' : '新しいコースを追加'}</DialogTitle>
                        <DialogDescription>
                            コースの詳細情報を入力してください。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right text-[13px]">コース名 <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="col-span-3 text-[13px]"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right text-[13px]">料金 (円) <span className="text-red-500">*</span></Label>
                            <Input
                                id="price"
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="col-span-3 text-[13px]"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="duration" className="text-right text-[13px]">時間 (分)</Label>
                            <Input
                                id="duration"
                                type="number"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                className="col-span-3 text-[13px]"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="orderIndex" className="text-right text-[13px]">表示順</Label>
                            <Input
                                id="orderIndex"
                                type="number"
                                value={formData.orderIndex}
                                onChange={(e) => setFormData({ ...formData, orderIndex: e.target.value })}
                                className="col-span-3 text-[13px]"
                                placeholder="数字が小さいほど上に表示されます"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2 text-[13px]">画像</Label>
                            <div className="col-span-3">
                                <ImageUpload
                                    value={formData.imageUrl}
                                    onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                                    onRemove={() => setFormData({ ...formData, imageUrl: '' })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right pt-2 text-[13px]">詳細 (説明文)</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="col-span-3 text-[13px]"
                                placeholder="コースの詳細や注意事項を入力してください"
                                rows={3}
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

            <AlertDialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>削除の確認</AlertDialogTitle>
                        <AlertDialogDescription>「{serviceToDelete?.name}」を削除しますか？この操作は取り消せません。</AlertDialogDescription>
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
