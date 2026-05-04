'use client'

import { useState, useEffect } from 'react'
import { Staff, Service } from '@/types/staff'
import { StoreData } from '@/lib/types/store'
import { staffService } from '@/lib/services/staff'
import { menuService } from '@/lib/services/menu'
import { getStoresAction } from '@/lib/actions/store'
import { toast } from 'sonner'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { MultiImageUpload } from '@/components/multi-image-upload'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface StaffListProps {
    initialStaff: Staff[]
    storeId: string
}

export function StaffList({ initialStaff, storeId }: StaffListProps) {
    const [staffList, setStaffList] = useState<Staff[]>(initialStaff)
    const [availableServices, setAvailableServices] = useState<Service[]>([])
    const [availableStores, setAvailableStores] = useState<StoreData[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
    const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: '', role: '', bio: '', specialties: '', serviceIds: [] as string[],
        storeIds: [storeId] as string[], instagram_url: '', twitter_url: '',
        greeting_message: '', years_of_experience: '', tags: '', images: [] as string[],
        back_margin_rate: '', user_id: '', nomination_fee: '', age: '', height: '',
        bust: '', cup: '', waist: '', hip: '', class_rank: '', is_new_face: false
    })

    useEffect(() => {
        loadServices()
        loadStores()
    }, [storeId])

    useEffect(() => {
        if (!isDialogOpen) {
            setEditingStaff(null)
            setFormData({ name: '', role: '', bio: '', specialties: '', serviceIds: [], storeIds: [storeId], instagram_url: '', twitter_url: '', greeting_message: '', years_of_experience: '', tags: '', images: [], back_margin_rate: '', user_id: '', nomination_fee: '', age: '', height: '', bust: '', cup: '', waist: '', hip: '', class_rank: '', is_new_face: false })
        }
    }, [isDialogOpen, storeId])

    async function loadServices() {
        try {
            const data = await menuService.getServicesByStoreId(storeId)
            setAvailableServices(data)
        } catch (error) {
            console.error('Error loading services:', error)
        }
    }

    async function loadStores() {
        try {
            const data = await getStoresAction()
            setAvailableStores(data || [])
        } catch (error) {
            console.error('Error loading stores:', error)
        }
    }

    const handleEditClick = (staff: Staff) => {
        setEditingStaff(staff)
        setFormData({
            name: staff.name, role: staff.role, bio: staff.bio || '',
            specialties: staff.specialties?.join(', ') || '', serviceIds: staff.serviceIds || [],
            storeIds: staff.storeIds || [storeId], instagram_url: staff.instagram_url || '',
            twitter_url: staff.twitter_url || '', greeting_message: staff.greeting_message || '',
            years_of_experience: staff.years_of_experience?.toString() || '',
            tags: staff.tags?.join(', ') || '', images: staff.images || [],
            back_margin_rate: staff.back_margin_rate?.toString() || '', user_id: staff.user_id || '',
            nomination_fee: staff.nomination_fee?.toString() || '', age: staff.age?.toString() || '',
            height: staff.height?.toString() || '', bust: staff.bust?.toString() || '',
            cup: staff.cup || '', waist: staff.waist?.toString() || '', hip: staff.hip?.toString() || '',
            class_rank: staff.class_rank || '', is_new_face: staff.is_new_face || false
        })
        setIsDialogOpen(true)
    }

    const handleSaveStaff = async () => {
        if (!formData.name || !formData.role) return
        setIsLoading(true)
        try {
            const specialtiesArray = formData.specialties.split(',').map(s => s.trim()).filter(Boolean)
            const tagsArray = formData.tags.split(',').map(s => s.trim()).filter(Boolean)
            const payload = {
                name: formData.name, role: formData.role, bio: formData.bio, specialties: specialtiesArray,
                serviceIds: formData.serviceIds, storeIds: formData.storeIds, instagram_url: formData.instagram_url,
                twitter_url: formData.twitter_url || undefined, greeting_message: formData.greeting_message,
                years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience, 10) : undefined,
                tags: tagsArray, images: formData.images,
                back_margin_rate: formData.back_margin_rate ? parseFloat(formData.back_margin_rate) : 0,
                user_id: formData.user_id || undefined,
                nomination_fee: formData.nomination_fee ? parseInt(formData.nomination_fee, 10) : 0,
                age: formData.age ? parseInt(formData.age, 10) : undefined, height: formData.height ? parseInt(formData.height, 10) : undefined,
                bust: formData.bust ? parseInt(formData.bust, 10) : undefined, cup: formData.cup || undefined,
                waist: formData.waist ? parseInt(formData.waist, 10) : undefined, hip: formData.hip ? parseInt(formData.hip, 10) : undefined,
                class_rank: formData.class_rank || undefined, is_new_face: formData.is_new_face
            }

            if (editingStaff) {
                const updated = await staffService.updateStaff(editingStaff.id, payload)
                setStaffList(staffList.map(s => s.id === updated.id ? updated : s))
                toast.success('更新しました')
            } else {
                const added = await staffService.addStaff({
                    ...payload, storeId: formData.storeIds[0] || storeId, avatarUrl: ''
                })
                setStaffList([added, ...staffList])
                toast.success('追加しました')
            }
            setIsDialogOpen(false)
        } catch (error) {
            console.error(error)
            toast.error('保存に失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteStaffConfirm = async () => {
        if (!staffToDelete) return
        try {
            await staffService.deleteStaff(staffToDelete.id)
            setStaffList(staffList.filter(s => s.id !== staffToDelete.id))
            toast.success('削除しました')
        } catch (error) {
            console.error(error)
            toast.error('削除に失敗しました')
        } finally {
            setStaffToDelete(null)
        }
    }

    const filteredStaff = staffList.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                <Input 
                    type="text" 
                    placeholder="キャスト名で検索..." 
                    className="w-[200px] h-8 text-[13px]" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button className="h-8 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 text-[13px] border border-gray-300">絞り込み</Button>
                
                <div className="ml-auto">
                    <Button onClick={() => setIsDialogOpen(true)} className="h-8 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold">
                        <Plus className="mr-1 h-4 w-4" /> キャストを追加
                    </Button>
                </div>
            </div>

            <div className="text-sm text-gray-600 mb-2">
                {filteredStaff.length}件中 1-{filteredStaff.length}件 を表示
            </div>

            <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px] text-center"><input type="checkbox" /></TableHead>
                            <TableHead className="w-[80px] text-center">写真</TableHead>
                            <TableHead>名前・ランク</TableHead>
                            <TableHead>属性・タグ</TableHead>
                            <TableHead>スペック</TableHead>
                            <TableHead className="w-[100px] text-center">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStaff.map((staff) => (
                            <TableRow key={staff.id}>
                                <TableCell className="text-center"><input type="checkbox" /></TableCell>
                                <TableCell className="text-center">
                                    <Avatar className="h-10 w-10 mx-auto rounded-md">
                                        <AvatarImage src={staff.images?.[0] || staff.avatarUrl} alt={staff.name} className="object-cover" />
                                        <AvatarFallback className="rounded-md bg-gray-100 text-gray-400">{staff.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell>
                                    <div className="font-bold text-[#4CAF50] text-[14px]">{staff.name}</div>
                                    <div className="text-gray-500 text-[11px] mt-0.5">{staff.class_rank || staff.role}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {staff.is_new_face && <Badge className="bg-pink-100 text-pink-700 border-pink-200 text-[10px] px-1.5 py-0 h-4">新人</Badge>}
                                        {staff.tags?.map((tag) => (
                                            <Badge key={tag} variant="outline" className="text-gray-500 text-[10px] px-1.5 py-0 h-4 bg-gray-50">{tag}</Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-gray-600 text-[12px]">
                                    {staff.age && <span className="mr-2">{staff.age}歳</span>}
                                    {staff.height && <span className="mr-2">T{staff.height}</span>}
                                    {staff.cup && <span className="mr-2">{staff.cup}cup</span>}
                                    {staff.years_of_experience && <span>歴{staff.years_of_experience}年</span>}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => handleEditClick(staff)} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => setStaffToDelete(staff)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredStaff.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    キャストが見つかりません。
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Editing Dialog - Simplified for brevity but containing the same logic as staff-manager */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 border-b bg-gray-50">
                        <DialogTitle>{editingStaff ? 'キャスト情報の編集' : '新しいキャストを追加'}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-[13px]">名前 <span className="text-red-500">*</span></Label>
                            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3 h-8 text-[13px]" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-[13px]">役割 <span className="text-red-500">*</span></Label>
                            <Input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="col-span-3 h-8 text-[13px]" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-[13px]">ランク</Label>
                            <Input value={formData.class_rank} onChange={e => setFormData({...formData, class_rank: e.target.value})} className="col-span-3 h-8 text-[13px]" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-[13px]">タグ</Label>
                            <Input value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="カンマ区切り" className="col-span-3 h-8 text-[13px]" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-[13px]">スペック</Label>
                            <div className="col-span-3 flex gap-2">
                                <Input type="number" placeholder="年齢" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="h-8 text-[13px]" />
                                <Input type="number" placeholder="身長" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="h-8 text-[13px]" />
                                <Input placeholder="カップ" value={formData.cup} onChange={e => setFormData({...formData, cup: e.target.value})} className="h-8 text-[13px]" />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right text-[13px] mt-2">自己紹介</Label>
                            <textarea
                                className="col-span-3 min-h-[80px] rounded-md border border-input px-3 py-2 text-[13px]"
                                value={formData.bio}
                                onChange={e => setFormData({...formData, bio: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-[13px]">画像</Label>
                            <div className="col-span-3">
                                <MultiImageUpload value={formData.images} onChange={(urls) => setFormData({ ...formData, images: urls })} maxImages={5} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t bg-gray-50">
                        <Button onClick={() => setIsDialogOpen(false)} variant="outline" className="h-8 text-[13px]">キャンセル</Button>
                        <Button onClick={handleSaveStaff} disabled={isLoading} className="h-8 text-[13px] bg-[#4CAF50] hover:bg-[#45a049] text-white">
                            {isLoading ? '保存中...' : '保存する'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!staffToDelete} onOpenChange={(open) => !open && setStaffToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>削除の確認</AlertDialogTitle>
                        <AlertDialogDescription>「{staffToDelete?.name}」を削除しますか？</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteStaffConfirm} className="bg-red-500 hover:bg-red-600 text-white">削除する</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
