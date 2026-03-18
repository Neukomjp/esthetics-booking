/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { menuService } from '@/lib/services/menu'
import { staffService } from '@/lib/services/staff'
import { createBookingAction, getAvailableTimeSlotsAction } from '@/lib/actions/booking'
import { paymentService, PaymentMethod } from '@/lib/services/payment'
import { Service, Staff, ServiceOption } from '@/types/staff'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, ChevronRight, ChevronDown, ChevronUp, User, Calendar, ClipboardList, CreditCard, Check } from 'lucide-react'
import { validateCouponAction } from '@/lib/actions/coupon'
import { WeeklyCalendar } from '../weekly-calendar'

interface StoreInfo {
    id: string
    name: string
    slug: string
    themeColor: string
    logoUrl: string
    bgColor: string
    headerBgColor: string
    textColor: string
    cardBgColor: string
}

interface ReserveClientProps {
    store: StoreInfo
}

const STEPS = [
    { num: 1, label: 'スタッフ選択', icon: User },
    { num: 2, label: 'メニュー選択', icon: ClipboardList },
    { num: 3, label: '日時選択', icon: Calendar },
    { num: 4, label: 'お客様情報', icon: CreditCard },
    { num: 5, label: '確認', icon: Check },
]

export function ReserveClient({ store }: ReserveClientProps) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [services, setServices] = useState<Service[]>([])
    const [staffList, setStaffList] = useState<Staff[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Form State
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [selectedOptions, setSelectedOptions] = useState<Record<string, ServiceOption[]>>({})
    const [availableOptions, setAvailableOptions] = useState<Record<string, ServiceOption[]>>({})
    const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})
    const [selectedStaff, setSelectedStaff] = useState<string>('')
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [time, setTime] = useState<string>('')
    const [customerName, setCustomerName] = useState('')
    const [customerEmail, setCustomerEmail] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')

    // Global Options
    const [selectedGlobalOptions, setSelectedGlobalOptions] = useState<ServiceOption[]>([])
    const [globalOptions, setGlobalOptions] = useState<ServiceOption[]>([])

    // Payment
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('local')
    const [couponCode, setCouponCode] = useState('')
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
    const [discountAmount, setDiscountAmount] = useState(0)
    const [couponError, setCouponError] = useState('')

    const [user, setUser] = useState<any>(null)

    // Load user
    useEffect(() => {
        const checkUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                if (profile) {
                    setCustomerName(profile.full_name || '')
                    setCustomerEmail(profile.email || user.email || '')
                    setCustomerPhone(profile.phone || '')
                }
            }
        }
        checkUser()
    }, [])

    // Load data
    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [fetchedServices, fetchedStaff, fetchedGlobalOptions] = await Promise.all([
                menuService.getServicesByStoreId(store.id),
                staffService.getStaffByStoreId(store.id),
                menuService.getGlobalOptionsByStoreId(store.id)
            ])
            setServices(fetchedServices)
            setStaffList(fetchedStaff)
            setGlobalOptions(fetchedGlobalOptions)
        } catch (error) {
            console.error('Failed to load booking data:', error)
            toast.error('データの読み込みに失敗しました')
        } finally {
            setLoading(false)
        }
    }, [store.id])

    useEffect(() => { loadData() }, [loadData])

    // Load options when services selected
    useEffect(() => {
        if (selectedServices.length > 0) {
            loadOptionsForServices(selectedServices)
        } else {
            setAvailableOptions({})
        }
    }, [selectedServices])

    async function loadOptionsForServices(serviceIds: string[]) {
        try {
            const results = await Promise.all(
                serviceIds.map(async id => ({
                    id,
                    options: await menuService.getOptionsByServiceId(id)
                }))
            )
            const newOpts: Record<string, ServiceOption[]> = {}
            results.forEach(r => { newOpts[r.id] = r.options })
            setAvailableOptions(prev => ({ ...prev, ...newOpts }))
        } catch (error) {
            console.error('Failed to load options:', error)
        }
    }

    // Calculate totals
    const selectedServiceObjects = services.filter(s => selectedServices.includes(s.id))
    const allServiceOptions = Object.values(selectedOptions).flat()
    const allOptions = [...allServiceOptions, ...selectedGlobalOptions]
    const servicesDuration = selectedServiceObjects.reduce((sum, s) => sum + s.duration_minutes, 0)
    const optionsDuration = allOptions.reduce((sum, opt) => sum + opt.duration_minutes, 0)
    const totalDuration = servicesDuration + optionsDuration
    const servicesPrice = selectedServiceObjects.reduce((sum, s) => sum + s.price, 0)
    const optionsPrice = allOptions.reduce((sum, opt) => sum + opt.price, 0)
    const nominationFee = (selectedStaff && selectedStaff !== 'no-preference')
        ? (staffList.find(s => s.id === selectedStaff)?.nomination_fee || 0) : 0
    const subtotal = servicesPrice + optionsPrice + nominationFee
    const totalPrice = Math.max(0, subtotal - discountAmount)

    const canProceed = () => {
        switch (step) {
            case 1: return !!selectedStaff
            case 2: return selectedServices.length > 0
            case 3: return !!date && !!time
            case 4: return !!customerName
            default: return true
        }
    }

    const handleApplyCoupon = async () => {
        if (!couponCode) return
        setCouponError('')
        setAppliedCoupon(null)
        setDiscountAmount(0)
        try {
            const coupon = await validateCouponAction(store.id, couponCode)
            if (!coupon) { setCouponError('無効なクーポンコードです'); return }
            let discount = coupon.discount_type === 'fixed'
                ? coupon.discount_amount
                : Math.floor(subtotal * (coupon.discount_amount / 100))
            if (discount > subtotal) discount = subtotal
            setAppliedCoupon(coupon)
            setDiscountAmount(discount)
            toast.success('クーポンを適用しました')
        } catch {
            setCouponError('クーポンの確認中にエラーが発生しました')
        }
    }

    const handleSubmit = async () => {
        if (!date || !time || selectedServices.length === 0 || !customerName) return
        setSubmitting(true)
        try {
            const primaryService = selectedServiceObjects[0]
            const secondaryServices = selectedServiceObjects.slice(1)

            let paymentStatus: 'unpaid' | 'paid' = 'unpaid'
            let initialBookingStatus = 'confirmed'
            if (paymentMethod === 'card') {
                paymentStatus = 'unpaid'
                initialBookingStatus = 'pending'
            } else if (paymentMethod !== 'local') {
                try {
                    await paymentService.createPaymentIntent(totalPrice, paymentMethod)
                    paymentStatus = 'paid'
                } catch {
                    toast.error('決済に失敗しました')
                    setSubmitting(false)
                    return
                }
            }

            const [hours, minutes] = time.split(':').map(Number)
            const bookingDate = new Date(date)
            bookingDate.setHours(hours, minutes)
            const endDate = new Date(bookingDate)
            endDate.setMinutes(endDate.getMinutes() + totalDuration)

            const bookingOptions = [
                ...secondaryServices.map(s => ({ name: `追加メニュー: ${s.name}`, price: s.price, duration_minutes: s.duration_minutes })),
                ...allOptions.map(o => ({ name: o.name, price: o.price, duration_minutes: o.duration_minutes }))
            ]

            const bookingResult = await createBookingAction({
                store_id: store.id,
                service_id: primaryService.id,
                staff_id: selectedStaff === 'no-preference' ? null : selectedStaff,
                auth_user_id: user?.id || null,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                start_time: bookingDate.toISOString(),
                end_time: endDate.toISOString(),
                options: bookingOptions,
                total_price: totalPrice,
                payment_status: paymentStatus,
                payment_method: paymentMethod,
                buffer_minutes_before: primaryService.buffer_time_before || 0,
                buffer_minutes_after: primaryService.buffer_time_after || 0,
                status: initialBookingStatus
            })

            if (paymentMethod === 'card') {
                try {
                    const res = await fetch('/api/checkout_sessions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            bookingId: bookingResult.id,
                            amount: totalPrice,
                            serviceName: primaryService.name,
                            storeName: store.name,
                            storeId: store.id,
                            customerEmail: customerEmail
                        })
                    })
                    const data = await res.json()
                    if (data.url) { window.location.href = data.url; return }
                    throw new Error(data.message || 'Stripe Session Error')
                } catch {
                    toast.error('決済画面への移行に失敗しました')
                    setSubmitting(false)
                    return
                }
            }

            // Send confirmation email
            const serviceName = selectedServiceObjects.map(s => s.name).join(', ')
            const staffName = selectedStaff === 'no-preference' ? '指定なし' : staffList.find(s => s.id === selectedStaff)?.name
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: customerEmail || 'customer@example.com',
                    subject: `【${store.name}】予約確定のお知らせ`,
                    storeId: store.id,
                    type: 'booking_confirmation',
                    data: { customerName, serviceName, staffName, date: bookingDate.toLocaleDateString(), time, paymentMethod: paymentMethod === 'local' ? '現地決済' : paymentMethod === 'card' ? 'クレジットカード' : 'PayPay', totalPrice, storeName: store.name }
                })
            })

            toast.success('予約が完了しました！')
            router.push(`/store/${store.slug}/thanks`)
        } catch (error: any) {
            console.error('Booking failed:', error)
            toast.error(error.message || '予約に失敗しました')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: store.bgColor, color: store.textColor }}>
                <Loader2 className="h-8 w-8 animate-spin opacity-50" />
            </div>
        )
    }

    return (
        <div className="min-h-screen font-sans" style={{ backgroundColor: store.bgColor, color: store.textColor }}>
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-md border-b border-white/10" style={{ backgroundColor: `${store.headerBgColor}e6` }}>
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href={`/store/${store.slug}`} className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                        <ArrowLeft className="h-4 w-4" />
                        <span>戻る</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        {store.logoUrl && <img src={store.logoUrl} alt="Logo" className="h-7 w-7 rounded-full object-cover" />}
                        <span className="font-bold text-sm">{store.name}</span>
                    </div>
                    <div className="w-16" />
                </div>
            </header>

            {/* Progress Steps */}
            <div className="max-w-3xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-8">
                    {STEPS.map((s, i) => (
                        <div key={s.num} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                        step >= s.num
                                            ? 'border-transparent text-black'
                                            : 'border-white/20 text-white/30'
                                    }`}
                                    style={step >= s.num ? { backgroundColor: store.themeColor } : {}}
                                >
                                    {step > s.num ? <Check className="h-5 w-5" /> : <s.icon className="h-4 w-4" />}
                                </div>
                                <span className={`text-[10px] mt-1.5 whitespace-nowrap ${step >= s.num ? 'opacity-100 font-bold' : 'opacity-40'}`}>
                                    {s.label}
                                </span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`hidden sm:block w-12 h-0.5 mx-1 mt-[-14px] ${step > s.num ? 'opacity-100' : 'opacity-20'}`} style={step > s.num ? { backgroundColor: store.themeColor } : { backgroundColor: 'white' }} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="rounded-2xl p-6 md:p-8 border border-white/10" style={{ backgroundColor: store.cardBgColor }}>

                    {/* Step 1: Staff Selection */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold mb-1">スタッフを選択</h2>
                                <p className="text-sm opacity-60">担当スタッフをお選びください。指名なしも可能です。</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* No preference */}
                                <button
                                    onClick={() => setSelectedStaff('no-preference')}
                                    className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                                        selectedStaff === 'no-preference' ? 'border-amber-500 bg-amber-500/5' : 'border-white/10 hover:border-white/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-2xl">👤</div>
                                        <div>
                                            <div className="font-bold text-lg">指名なし</div>
                                            <div className="text-xs opacity-50">どのスタッフでもOK</div>
                                        </div>
                                    </div>
                                    {selectedStaff === 'no-preference' && (
                                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: store.themeColor }}>
                                            <Check className="h-4 w-4 text-black" />
                                        </div>
                                    )}
                                </button>

                                {staffList.map(staff => (
                                    <button
                                        key={staff.id}
                                        onClick={() => setSelectedStaff(staff.id)}
                                        className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                                            selectedStaff === staff.id ? 'border-amber-500 bg-amber-500/5' : 'border-white/10 hover:border-white/30'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-14 h-14 rounded-full overflow-hidden bg-white/5 shrink-0">
                                                {staff.avatarUrl ? (
                                                    <img src={staff.avatarUrl} alt={staff.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center font-bold text-xl opacity-50">{staff.name.charAt(0)}</div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-lg truncate">{staff.name}</div>
                                                <div className="text-xs opacity-50">{staff.role}</div>
                                            </div>
                                        </div>
                                        {staff.nomination_fee && staff.nomination_fee > 0 && (
                                            <div className="text-xs px-2 py-0.5 rounded-full inline-block mt-1" style={{ backgroundColor: `${store.themeColor}20`, color: store.themeColor }}>
                                                指名料 ¥{staff.nomination_fee.toLocaleString()}
                                            </div>
                                        )}
                                        {staff.greeting_message && (
                                            <p className="text-xs opacity-40 mt-2 line-clamp-2">{staff.greeting_message}</p>
                                        )}
                                        {selectedStaff === staff.id && (
                                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: store.themeColor }}>
                                                <Check className="h-4 w-4 text-black" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Menu Selection */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold mb-1">メニューを選択</h2>
                                <p className="text-sm opacity-60">ご希望のメニューをお選びください（複数選択可）</p>
                            </div>
                            <div className="space-y-3">
                                {services.map(service => (
                                    <div key={service.id} className={`rounded-xl border-2 transition-all overflow-hidden ${
                                        selectedServices.includes(service.id) ? 'border-amber-500 bg-amber-500/5' : 'border-white/10'
                                    }`}>
                                        <button
                                            className="w-full p-4 text-left flex items-start gap-3"
                                            onClick={() => {
                                                if (selectedServices.includes(service.id)) {
                                                    setSelectedServices(selectedServices.filter(id => id !== service.id))
                                                    setSelectedOptions(prev => { const next = { ...prev }; delete next[service.id]; return next })
                                                } else {
                                                    setSelectedServices([...selectedServices, service.id])
                                                }
                                            }}
                                        >
                                            {service.image_url && (
                                                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-white/5">
                                                    <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <span className="font-bold break-words">{service.name}</span>
                                                    <div className="text-right shrink-0">
                                                        <div className="font-bold" style={{ color: store.themeColor }}>¥{service.price.toLocaleString()}</div>
                                                        <div className="text-xs opacity-50">{service.duration_minutes}分</div>
                                                    </div>
                                                </div>
                                                {service.description && (
                                                    <div className="mt-1">
                                                        <button
                                                            type="button"
                                                            className="text-xs flex items-center gap-1 hover:opacity-80"
                                                            style={{ color: store.themeColor }}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setExpandedDescriptions(prev => ({ ...prev, [service.id]: !prev[service.id] }))
                                                            }}
                                                        >
                                                            {expandedDescriptions[service.id] ? <>閉じる <ChevronUp className="h-3 w-3" /></> : <>詳細 <ChevronDown className="h-3 w-3" /></>}
                                                        </button>
                                                        {expandedDescriptions[service.id] && (
                                                            <p className="text-sm opacity-60 mt-2 whitespace-pre-wrap">{service.description}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center mt-1 ${
                                                selectedServices.includes(service.id) ? 'border-transparent' : 'border-white/20'
                                            }`} style={selectedServices.includes(service.id) ? { backgroundColor: store.themeColor } : {}}>
                                                {selectedServices.includes(service.id) && <Check className="h-4 w-4 text-black" />}
                                            </div>
                                        </button>

                                        {/* Service-specific options */}
                                        {selectedServices.includes(service.id) && availableOptions[service.id]?.length > 0 && (
                                            <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3 ml-4">
                                                <span className="text-xs opacity-50">オプション</span>
                                                {availableOptions[service.id].map(option => (
                                                    <label key={option.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                checked={selectedOptions[service.id]?.some(o => o.id === option.id) || false}
                                                                onCheckedChange={(checked) => {
                                                                    setSelectedOptions(prev => {
                                                                        const curr = prev[service.id] || []
                                                                        return { ...prev, [service.id]: checked ? [...curr, option] : curr.filter(o => o.id !== option.id) }
                                                                    })
                                                                }}
                                                            />
                                                            <span className="text-sm">{option.name}</span>
                                                        </div>
                                                        <span className="text-xs opacity-60">+¥{option.price.toLocaleString()} / +{option.duration_minutes}分</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Global Options */}
                            {globalOptions.length > 0 && (
                                <div className="border-t border-white/10 pt-4 space-y-3">
                                    <h3 className="font-bold">全体オプション</h3>
                                    {globalOptions.map(option => (
                                        <label key={option.id} className="flex items-center justify-between gap-2 p-3 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={selectedGlobalOptions.some(o => o.id === option.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) setSelectedGlobalOptions([...selectedGlobalOptions, option])
                                                        else setSelectedGlobalOptions(selectedGlobalOptions.filter(o => o.id !== option.id))
                                                    }}
                                                />
                                                <span className="text-sm">{option.name}</span>
                                            </div>
                                            <span className="text-xs opacity-60">+¥{option.price.toLocaleString()}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Date/Time Selection */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold mb-1">日時を選択</h2>
                                <p className="text-sm opacity-60">ご希望の日時をお選びください（◎をタップ）</p>
                            </div>
                            <div className="overflow-x-auto -mx-6 px-6">
                                <WeeklyCalendar
                                    storeId={store.id}
                                    onSelect={(d, t) => {
                                        setDate(d)
                                        if (t) setTime(t)
                                    }}
                                    durationMinutes={totalDuration}
                                    staffId={selectedStaff === 'no-preference' ? undefined : selectedStaff}
                                    bufferBefore={selectedServiceObjects[0]?.buffer_time_before || 0}
                                    bufferAfter={selectedServiceObjects[0]?.buffer_time_after || 0}
                                />
                            </div>
                            {date && time && (
                                <div className="text-center py-4 rounded-xl border border-white/10 bg-white/5">
                                    <div className="text-xs opacity-50 mb-1">選択日時</div>
                                    <div className="text-2xl font-bold" style={{ color: store.themeColor }}>
                                        {date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })} {time}〜
                                    </div>
                                    <div className="text-xs opacity-50 mt-1">{totalDuration}分のご予約</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Customer Info + Payment */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold mb-1">お客様情報</h2>
                                <p className="text-sm opacity-60">ご連絡先をご入力ください</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm opacity-70 mb-1.5 block">お名前 <span className="text-red-400">*</span></Label>
                                    <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="山田 太郎"
                                        className="bg-white/5 border-white/10 focus:border-amber-500" />
                                </div>
                                <div>
                                    <Label className="text-sm opacity-70 mb-1.5 block">メールアドレス（任意）</Label>
                                    <Input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="taro@example.com"
                                        className="bg-white/5 border-white/10 focus:border-amber-500" />
                                </div>
                                <div>
                                    <Label className="text-sm opacity-70 mb-1.5 block">電話番号（任意）</Label>
                                    <Input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="090-1234-5678"
                                        className="bg-white/5 border-white/10 focus:border-amber-500" />
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-4 space-y-3">
                                <Label className="text-sm opacity-70 block">お支払い方法</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'local', label: '現地決済', icon: '🏠' },
                                        { value: 'card', label: 'カード', icon: '💳' },
                                        { value: 'paypay', label: 'PayPay', icon: '📱' },
                                    ].map(pm => (
                                        <button
                                            key={pm.value}
                                            onClick={() => setPaymentMethod(pm.value as PaymentMethod)}
                                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                                                paymentMethod === pm.value ? 'border-amber-500 bg-amber-500/5' : 'border-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <span className="text-xl">{pm.icon}</span>
                                            <span className="text-xs font-medium">{pm.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Coupon */}
                            <div className="border-t border-white/10 pt-4 space-y-2">
                                <Label className="text-sm opacity-70 block">クーポンコード</Label>
                                <div className="flex gap-2">
                                    <Input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="クーポンコードを入力"
                                        className="bg-white/5 border-white/10 flex-1" disabled={!!appliedCoupon} />
                                    {appliedCoupon ? (
                                        <Button variant="outline" onClick={() => { setAppliedCoupon(null); setDiscountAmount(0); setCouponCode('') }}
                                            className="border-white/10">クリア</Button>
                                    ) : (
                                        <Button onClick={handleApplyCoupon} disabled={!couponCode}
                                            style={{ backgroundColor: store.themeColor }} className="text-black font-bold">適用</Button>
                                    )}
                                </div>
                                {couponError && <p className="text-xs text-red-400">{couponError}</p>}
                                {appliedCoupon && <p className="text-xs text-green-400">{appliedCoupon.name} 適用済み (-¥{discountAmount.toLocaleString()})</p>}
                            </div>
                        </div>
                    )}

                    {/* Step 5: Confirmation */}
                    {step === 5 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold mb-1">ご予約内容の確認</h2>
                                <p className="text-sm opacity-60">以下の内容でよろしければ「予約を確定」を押してください</p>
                            </div>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between py-3 border-b border-white/10">
                                    <span className="opacity-60">スタッフ</span>
                                    <span className="font-bold">{selectedStaff === 'no-preference' ? '指名なし' : staffList.find(s => s.id === selectedStaff)?.name}
                                        {nominationFee > 0 && <span className="text-xs opacity-60 ml-1">(指名料 ¥{nominationFee.toLocaleString()})</span>}
                                    </span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-white/10">
                                    <span className="opacity-60">メニュー</span>
                                    <div className="text-right">
                                        {selectedServiceObjects.map(s => (
                                            <div key={s.id}>{s.name} <span className="opacity-50">¥{s.price.toLocaleString()}</span></div>
                                        ))}
                                    </div>
                                </div>
                                {allOptions.length > 0 && (
                                    <div className="flex justify-between py-3 border-b border-white/10">
                                        <span className="opacity-60">オプション</span>
                                        <div className="text-right">
                                            {allOptions.map((o, i) => (
                                                <div key={i}>{o.name} <span className="opacity-50">+¥{o.price.toLocaleString()}</span></div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-between py-3 border-b border-white/10">
                                    <span className="opacity-60">日時</span>
                                    <span className="font-bold">{date?.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })} {time}〜</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-white/10">
                                    <span className="opacity-60">施術時間</span>
                                    <span>{totalDuration}分</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-white/10">
                                    <span className="opacity-60">お名前</span>
                                    <span>{customerName}</span>
                                </div>
                                {customerEmail && (
                                    <div className="flex justify-between py-3 border-b border-white/10">
                                        <span className="opacity-60">メール</span>
                                        <span>{customerEmail}</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-3 border-b border-white/10">
                                    <span className="opacity-60">お支払い</span>
                                    <span>{paymentMethod === 'local' ? '現地決済' : paymentMethod === 'card' ? 'クレジットカード' : 'PayPay'}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between py-3 border-b border-white/10 text-green-400">
                                        <span>クーポン割引</span>
                                        <span>-¥{discountAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-4 text-lg">
                                    <span className="font-bold">合計</span>
                                    <span className="font-bold text-2xl" style={{ color: store.themeColor }}>¥{totalPrice.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className={`flex justify-between mt-6 gap-4 ${step >= 2 && selectedServices.length > 0 ? 'pb-20' : ''}`}>
                    {step > 1 ? (
                        <Button variant="outline" onClick={() => setStep(step - 1)} className="border-white/10 hover:bg-white/5">
                            <ArrowLeft className="h-4 w-4 mr-1" /> 戻る
                        </Button>
                    ) : (
                        <div />
                    )}

                    {step < 5 ? (
                        <Button
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceed()}
                            className="px-8 font-bold text-black"
                            style={{ backgroundColor: canProceed() ? store.themeColor : undefined }}
                        >
                            次へ <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-8 font-bold text-black text-lg py-6"
                            style={{ backgroundColor: store.themeColor }}
                        >
                            {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                            {submitting ? '処理中...' : '予約を確定する'}
                        </Button>
                    )}
                </div>

                {/* Fixed Bottom Bar with summary + navigation */}
                {step >= 2 && selectedServices.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 p-3 backdrop-blur-xl" style={{ backgroundColor: `${store.headerBgColor}f0` }}>
                        <div className="max-w-3xl mx-auto flex items-center justify-between text-sm gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="opacity-50 text-xs truncate">{selectedServiceObjects.map(s => s.name).join(' + ')}</div>
                                <div className="font-bold" style={{ color: store.themeColor }}>
                                    ¥{totalPrice.toLocaleString()} / {totalDuration}分
                                    {date && time && <span className="opacity-50 text-xs ml-2">{date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })} {time}〜</span>}
                                </div>
                            </div>
                            {step < 5 ? (
                                <Button
                                    onClick={() => setStep(step + 1)}
                                    disabled={!canProceed()}
                                    size="sm"
                                    className="px-6 font-bold text-black shrink-0"
                                    style={{ backgroundColor: canProceed() ? store.themeColor : undefined }}
                                >
                                    次へ <ChevronRight className="h-4 w-4 ml-0.5" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    size="sm"
                                    className="px-6 font-bold text-black shrink-0"
                                    style={{ backgroundColor: store.themeColor }}
                                >
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                    {submitting ? '処理中' : '予約確定'}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
