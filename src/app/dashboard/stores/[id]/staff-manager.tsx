'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { Staff, Service } from '@/types/staff'
import { StoreData } from '@/lib/types/store'
import { staffService } from '@/lib/services/staff'
import { menuService } from '@/lib/services/menu'
import { storeService } from '@/lib/services/stores'
import { getStoresAction } from '@/lib/actions/store'
import { toast } from 'sonner'
import { ShiftDialog } from './shift-dialog'
import { MultiImageUpload } from '@/components/multi-image-upload'

interface StaffManagerProps {
    storeId: string
}

export function StaffManager({ storeId }: StaffManagerProps) {
    const [staffList, setStaffList] = useState<Staff[]>([])
    const [availableServices, setAvailableServices] = useState<Service[]>([])
    const [availableStores, setAvailableStores] = useState<StoreData[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
    const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        bio: '',
        specialties: '', // Comma separated for input
        serviceIds: [] as string[],
        storeIds: [storeId] as string[],
        instagram_url: '',
        twitter_url: '',
        greeting_message: '',
        years_of_experience: '',
        tags: '',
        images: [] as string[],
        back_margin_rate: '',
        user_id: '',
        nomination_fee: '',
        age: '',
        height: '',
        bust: '',
        cup: '',
        waist: '',
        hip: '',
        class_rank: '',
        is_new_face: false
    })
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        loadStaff()
        loadServices()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storeId])

    useEffect(() => {
        if (!isDialogOpen) {
            setEditingStaff(null)
            setFormData({ name: '', role: '', bio: '', specialties: '', serviceIds: [], storeIds: [storeId], instagram_url: '', twitter_url: '', greeting_message: '', years_of_experience: '', tags: '', images: [], back_margin_rate: '', user_id: '', nomination_fee: '', age: '', height: '', bust: '', cup: '', waist: '', hip: '', class_rank: '', is_new_face: false })
        }
    }, [isDialogOpen, storeId])

    async function loadStaff() {
        try {
            const data = await staffService.getStaffByStoreId(storeId)
            setStaffList(data)
        } catch (error) {
            console.error('Error loading staff:', error)
            toast.error('スタッフ情報の取得に失敗しました')
        }
    }

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

    useEffect(() => {
        loadStores()
    }, [])

    const handleEditClick = (staff: Staff) => {
        setEditingStaff(staff)
        setFormData({
            name: staff.name,
            role: staff.role,
            bio: staff.bio || '',
            specialties: staff.specialties?.join(', ') || '',
            serviceIds: staff.serviceIds || [],
            storeIds: staff.storeIds || [storeId],
            instagram_url: staff.instagram_url || '',
            greeting_message: staff.greeting_message || '',
            years_of_experience: staff.years_of_experience?.toString() || '',
            tags: staff.tags?.join(', ') || '',
            images: staff.images || [],
            back_margin_rate: staff.back_margin_rate?.toString() || '',
            user_id: staff.user_id || '',
            nomination_fee: staff.nomination_fee?.toString() || '',
            age: staff.age?.toString() || '',
            height: staff.height?.toString() || '',
            bust: staff.bust?.toString() || '',
            cup: staff.cup || '',
            waist: staff.waist?.toString() || '',
            hip: staff.hip?.toString() || '',
            class_rank: staff.class_rank || '',
            twitter_url: staff.twitter_url || '',
            is_new_face: staff.is_new_face || false
        })
        setIsDialogOpen(true)
    }

    const handleSaveStaff = async () => {
        if (!formData.name || !formData.role) return

        setIsLoading(true)
        try {
            const specialtiesArray = formData.specialties.split(',').map(s => s.trim()).filter(Boolean)
            const tagsArray = formData.tags.split(',').map(s => s.trim()).filter(Boolean)
            const yearsNum = formData.years_of_experience ? parseInt(formData.years_of_experience, 10) : undefined
            const backMarginNum = formData.back_margin_rate ? parseFloat(formData.back_margin_rate) : 0
            const nominationFeeNum = formData.nomination_fee ? parseInt(formData.nomination_fee, 10) : 0
            const ageNum = formData.age ? parseInt(formData.age, 10) : undefined
            const heightNum = formData.height ? parseInt(formData.height, 10) : undefined
            const bustNum = formData.bust ? parseInt(formData.bust, 10) : undefined
            const waistNum = formData.waist ? parseInt(formData.waist, 10) : undefined
            const hipNum = formData.hip ? parseInt(formData.hip, 10) : undefined

            if (editingStaff) {
                // Update
                const updated = await staffService.updateStaff(editingStaff.id, {
                    name: formData.name,
                    role: formData.role,
                    bio: formData.bio,
                    specialties: specialtiesArray,
                    serviceIds: formData.serviceIds,
                    storeIds: formData.storeIds,
                    instagram_url: formData.instagram_url,
                    greeting_message: formData.greeting_message,
                    years_of_experience: yearsNum,
                    images: formData.images,
                    back_margin_rate: backMarginNum,
                    user_id: formData.user_id || undefined,
                    nomination_fee: nominationFeeNum,
                    age: ageNum,
                    height: heightNum,
                    bust: bustNum,
                    cup: formData.cup || undefined,
                    waist: waistNum,
                    hip: hipNum,
                    class_rank: formData.class_rank || undefined,
                    twitter_url: formData.twitter_url || undefined,
                    is_new_face: formData.is_new_face
                })
                setStaffList(staffList.map(s => s.id === updated.id ? updated : s))
                toast.success('スタッフ情報を更新しました')
            } else {
                // Add
                const added = await staffService.addStaff({
                    storeId: formData.storeIds[0] || storeId,
                    storeIds: formData.storeIds.length > 0 ? formData.storeIds : [storeId],
                    name: formData.name,
                    role: formData.role,
                    bio: formData.bio,
                    specialties: specialtiesArray,
                    serviceIds: formData.serviceIds,
                    avatarUrl: '',
                    instagram_url: formData.instagram_url,
                    greeting_message: formData.greeting_message,
                    years_of_experience: yearsNum,
                    tags: tagsArray,
                    images: formData.images,
                    back_margin_rate: backMarginNum,
                    user_id: formData.user_id || undefined,
                    nomination_fee: nominationFeeNum,
                    age: ageNum,
                    height: heightNum,
                    bust: bustNum,
                    cup: formData.cup || undefined,
                    waist: waistNum,
                    hip: hipNum,
                    class_rank: formData.class_rank || undefined,
                    twitter_url: formData.twitter_url || undefined,
                    is_new_face: formData.is_new_face
                })
                setStaffList([added, ...staffList])
                toast.success('スタッフを追加しました')
            }
            setIsDialogOpen(false)
        } catch (error) {
            console.error('Error saving staff:', error)
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
            toast.success('スタッフを削除しました')
        } catch (error) {
            console.error('Error deleting staff:', error)
            toast.error('スタッフの削除に失敗しました')
        } finally {
            setStaffToDelete(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">スタッフ一覧</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> スタッフを追加</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>{editingStaff ? 'スタッフ情報の編集' : '新しいスタッフを追加'}</DialogTitle>
                            <DialogDescription>
                                スタッフの基本情報を入力してください。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 px-1 max-h-[60vh] overflow-y-auto w-full overflow-x-hidden">
                            <div className="flex flex-col gap-2 mb-4">
                                <Label className="font-semibold text-lg">キャスト画像 (最大15枚)</Label>
                                <MultiImageUpload 
                                    value={formData.images} 
                                    onChange={(urls) => setFormData({ ...formData, images: urls })} 
                                    maxImages={15}
                                />
                                <p className="text-xs text-muted-foreground mt-1">※ 1枚目が一覧やトップに表示されるメイン画像になります。</p>
                            </div>

                            <hr className="mb-4" />

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">名前 <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="col-span-3"
                                    placeholder="山田 太郎"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">役割 <span className="text-red-500">*</span></Label>
                                <Input
                                    id="role"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="col-span-3"
                                    placeholder="例: スタイリスト"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="specialties" className="text-right">得意施術</Label>
                                <Input
                                    id="specialties"
                                    value={formData.specialties}
                                    onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                                    className="col-span-3"
                                    placeholder="カット, カラー, パーマ (カンマ区切り)"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="bio" className="text-right mt-2">自己紹介</Label>
                                <textarea
                                    id="bio"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="スタッフの自己紹介文を入力してください"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="tags" className="text-right">個性タグ</Label>
                                <Input
                                    id="tags"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="col-span-3"
                                    placeholder="小顔矯正, リラックス, おしゃべり好き (カンマ区切り)"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="years" className="text-right">経験年数</Label>
                                <Input
                                    id="years"
                                    type="number"
                                    value={formData.years_of_experience}
                                    onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
                                    className="col-span-3"
                                    placeholder="例: 5"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="instagram" className="text-right">Instagram URL</Label>
                                <Input
                                    id="instagram"
                                    type="url"
                                    value={formData.instagram_url}
                                    onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                                    className="col-span-3"
                                    placeholder="https://instagram.com/..."
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="twitter" className="text-right">X (Twitter) URL</Label>
                                <Input
                                    id="twitter"
                                    type="url"
                                    value={formData.twitter_url}
                                    onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                                    className="col-span-3"
                                    placeholder="https://x.com/..."
                                />
                            </div>
                            <hr className="my-2" />
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="class_rank" className="text-right">クラス / ランク</Label>
                                <Input
                                    id="class_rank"
                                    value={formData.class_rank}
                                    onChange={(e) => setFormData({ ...formData, class_rank: e.target.value })}
                                    className="col-span-3"
                                    placeholder="例: PLATINUM, GOLD, レギュラー"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">新人フラグ</Label>
                                <div className="col-span-3 flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="new_face"
                                        checked={formData.is_new_face}
                                        onChange={(e) => setFormData({ ...formData, is_new_face: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="new_face" className="text-sm cursor-pointer">
                                        New Face として表示する
                                    </label>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4 mt-2">
                                <Label className="text-right mt-1">スペック</Label>
                                <div className="col-span-3 grid grid-cols-3 gap-2">
                                    <Input placeholder="年齢" type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                                    <Input placeholder="身長 (cm)" type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} />
                                    <Input placeholder="カップ (例: F)" value={formData.cup} onChange={e => setFormData({...formData, cup: e.target.value})} />
                                    <Input placeholder="Bust (cm)" type="number" value={formData.bust} onChange={e => setFormData({...formData, bust: e.target.value})} />
                                    <Input placeholder="Waist (cm)" type="number" value={formData.waist} onChange={e => setFormData({...formData, waist: e.target.value})} />
                                    <Input placeholder="Hip (cm)" type="number" value={formData.hip} onChange={e => setFormData({...formData, hip: e.target.value})} />
                                </div>
                            </div>
                            <hr className="my-2" />
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="greeting" className="text-right mt-2">ご挨拶文</Label>
                                <textarea
                                    id="greeting"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
                                    value={formData.greeting_message}
                                    onChange={(e) => setFormData({ ...formData, greeting_message: e.target.value })}
                                    placeholder="お客様へのメッセージ・挨拶文を入力してください"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="backMargin" className="text-right">バック率 (%)</Label>
                                <Input
                                    id="backMargin"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.back_margin_rate}
                                    onChange={(e) => setFormData({ ...formData, back_margin_rate: e.target.value })}
                                    className="col-span-3"
                                    placeholder="例: 50"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="nominationFee" className="text-right">指名料 (円)</Label>
                                <Input
                                    id="nominationFee"
                                    type="number"
                                    min="0"
                                    value={formData.nomination_fee}
                                    onChange={(e) => setFormData({ ...formData, nomination_fee: e.target.value })}
                                    className="col-span-3"
                                    placeholder="例: 1000"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="userId" className="text-right text-xs">連携ユーザーID<br/>(ログイン用)</Label>
                                <Input
                                    id="userId"
                                    value={formData.user_id}
                                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                    className="col-span-3"
                                    placeholder="連携させるキャストのアカウントID"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right mt-2">対応メニュー</Label>
                                <div className="col-span-3 space-y-2 border rounded-md p-3 max-h-[150px] overflow-y-auto">
                                    {availableServices.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">メニューが登録されていません</p>
                                    ) : (
                                        availableServices.map((service) => (
                                            <div key={service.id} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`service-${service.id}`}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                    checked={formData.serviceIds.includes(service.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({
                                                                ...formData,
                                                                serviceIds: [...formData.serviceIds, service.id]
                                                            })
                                                        } else {
                                                            setFormData({
                                                                ...formData,
                                                                serviceIds: formData.serviceIds.filter(id => id !== service.id)
                                                            })
                                                        }
                                                    }}
                                                />
                                                <label htmlFor={`service-${service.id}`} className="text-sm cursor-pointer select-none">
                                                    {service.name}
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right mt-2">所属店舗 <span className="text-red-500">*</span></Label>
                                <div className="col-span-3 space-y-2 border rounded-md p-3 max-h-[150px] overflow-y-auto bg-stone-50">
                                    {availableStores.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">店舗情報が見つかりません</p>
                                    ) : (
                                        availableStores.map((store) => (
                                            <div key={store.id} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`store-${store.id}`}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                    checked={formData.storeIds.includes(store.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({
                                                                ...formData,
                                                                storeIds: [...formData.storeIds, store.id]
                                                            })
                                                        } else {
                                                            // Prevent unchecking the last element
                                                            if (formData.storeIds.length <= 1) {
                                                                toast.error('少なくとも1つの店舗に所属する必要があります')
                                                                return
                                                            }
                                                            setFormData({
                                                                ...formData,
                                                                storeIds: formData.storeIds.filter(id => id !== store.id)
                                                            })
                                                        }
                                                    }}
                                                />
                                                <label htmlFor={`store-${store.id}`} className="text-sm cursor-pointer select-none font-medium">
                                                    {store.name}
                                                    {store.id === storeId && <span className="text-xs ml-2 text-gray-500 font-normal">(現在の店舗)</span>}
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSaveStaff} disabled={isLoading}>
                                {isLoading ? '保存中...' : '保存する'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {staffList.map((staff) => (
                    <Card key={staff.id}>
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            <Avatar>
                                <AvatarImage src={staff.avatarUrl} alt={staff.name} />
                                <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <CardTitle className="text-base">{storeId ? staff.name : 'Sample'}</CardTitle>
                                <p className="text-sm text-muted-foreground">{staff.role}</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-1 mb-4 h-6 overflow-hidden">
                                {staff.specialties?.map((spec) => (
                                    <Badge key={spec} variant="secondary" className="text-xs">{spec}</Badge>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <Button variant="outline" size="sm" className="w-full" onClick={() => handleEditClick(staff)}>
                                    情報の編集
                                </Button>
                                <ShiftDialog staffId={staff.id} staffName={staff.name} storeId={storeId} />
                                <Button variant="ghost" size="sm" className="w-full text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setStaffToDelete(staff)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> 削除
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!staffToDelete} onOpenChange={(open) => !open && setStaffToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                            「{staffToDelete?.name}」のスタッフ情報を削除します。この操作は取り消せません。設定されていたシフト情報も同時に削除される場合があります。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteStaffConfirm} className="bg-red-500 hover:bg-red-600 text-white">
                            削除する
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

