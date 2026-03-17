/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Clock, Navigation } from 'lucide-react'
import { storeService } from '@/lib/services/stores'
import { organizationService } from '@/lib/services/organizations'
import { menuService } from '@/lib/services/menu'

import { staffService } from '@/lib/services/staff'
import { newsService, News } from '@/lib/services/news'
import { Service, Staff } from '@/types/staff'
import { BookingSection } from './booking-section'
import { MenuList } from './menu-list'

function formatBusinessHours(days: any[] | undefined) {
    if (!days || days.length === 0) return '営業時間未設定'
    const openDays = days.filter(d => !d.is_closed)
    if (openDays.length === 0) return '休業中'
    
    const firstOpen = openDays[0]
    const closedDaysStr = days.filter(d => d.is_closed).map(d => ['日', '月', '火', '水', '木', '金', '土'][d.day_of_week]).join('・')
    
    let timeStr = `${firstOpen.start_time} - ${firstOpen.end_time}`
    if (closedDaysStr) {
        timeStr += ` (${closedDaysStr}休)`
    }
    return timeStr
}

export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const params = await props.params
    const store = await storeService.getStoreBySlug(params.slug)

    if (!store) {
        return { title: 'Store Not Found' }
    }

    const theme = store.theme_config as any || {}
    const seo = theme.seo || {}

    return {
        title: seo.title || `${store.name} | 公式サイト`,
        description: seo.description || store.description || `Welcome to ${store.name}`,
        openGraph: {
            title: seo.title || store.name,
            description: seo.description || store.description || `Welcome to ${store.name}`,
            images: seo.ogImage ? [{ url: seo.ogImage }] : store.cover_image_url ? [{ url: store.cover_image_url }] : [],
        }
    }
}

export default async function StorePublicPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params
    let store
    let organization
    let menuItems: Service[] = []

    let staffList: Staff[] = []
    let newsList: News[] = []

    try {
        const supabase = await createClient()
        store = await storeService.getStoreBySlug(params.slug, supabase)
        if (store) {
            menuItems = await menuService.getServicesByStoreId(store.id, supabase)

            staffList = await staffService.getStaffByStoreId(store.id, supabase)
            newsList = await newsService.getNewsByStoreId(store.id)
            if (store.organization_id) {
                organization = await organizationService.getOrganizationById(store.organization_id, supabase)
            }
        }
    } catch (error) {
        console.error('Error fetching store data:', error)
    }

    if (!store) {
        notFound()
    }

    const theme = store.theme_config as any || {}
    const heroImage = store.cover_image_url || 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=2070&auto=format&fit=crop'
    const logoUrl = store.logo_url
    const welcomeMessage = theme.welcomeMessage || ''
    const heroTagline = theme.heroTagline || '極上の癒やしと非日常の空間へ'

    // Customizable colors from theme_config
    const bgColor = theme.bgColor || '#0a0a0a'
    const bgImage = theme.bgImage || ''
    const sectionBgColor = theme.sectionBgColor || '#09090b'
    const headerBgColor = theme.headerBgColor || '#000000'
    const cardBgColor = theme.cardBgColor || '#000000'
    const textColor = theme.textColor || '#d4d4d8'

    const newFaces = staffList.filter(s => s.is_new_face)
    const activeNews = newsList.filter(n => n.is_published).slice(0, 5)

    return (
        <div className="min-h-screen font-sans selection:bg-amber-500/30 relative" style={{ backgroundColor: bgColor, color: textColor }}>
            {bgImage && (
                <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-10" style={{ backgroundImage: `url(${bgImage})` }} />
            )}
            <div className="relative z-10">
            {/* Header / Nav */}
            <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md border-b border-white/10" style={{ backgroundColor: `${headerBgColor}e6` }}>
                <div className="max-w-6xl mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        {logoUrl && <img src={logoUrl} alt="Logo" className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover" />}
                        <h1 className="text-base md:text-xl font-bold bg-gradient-to-r from-amber-200 to-yellow-600 bg-clip-text text-transparent truncate max-w-[180px] md:max-w-none">
                            {store.name}
                        </h1>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                        <Link href="#schedule" className="hover:text-amber-500 transition-colors">Schedule</Link>
                        <Link href="#new-face" className="hover:text-amber-500 transition-colors">New Face</Link>
                        <Link href="#system" className="hover:text-amber-500 transition-colors">System</Link>
                        <Link href="#information" className="hover:text-amber-500 transition-colors">Information</Link>
                        <Link href="#access" className="hover:text-amber-500 transition-colors">Access</Link>
                    </nav>
                    <div className="hidden md:block">
                        <Button size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold hover:brightness-110 border-none" asChild>
                            <Link href="/login/customer">WEB予約</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative h-[60vh] md:h-[80vh] w-full mt-14 md:mt-16 flex items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full scale-105"
                    style={{ backgroundImage: `url(${heroImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0a0a0a]" />
                
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
                    <div className="text-amber-500 mb-4 md:mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                         {logoUrl && <img src={logoUrl} alt="Store Logo" className="w-24 h-24 md:w-40 md:h-40 rounded-full border-2 border-amber-500/50 shadow-2xl mx-auto object-cover" />}
                    </div>
                    <h2 className="text-2xl md:text-5xl font-serif tracking-widest text-white drop-shadow-lg mb-4 md:mb-6 leading-tight">
                        {heroTagline}
                    </h2>
                    {welcomeMessage && (
                        <p className="text-zinc-300 text-sm md:text-lg mb-6 md:mb-10 whitespace-pre-wrap leading-relaxed max-w-2xl mx-auto font-light">
                            {welcomeMessage}
                        </p>
                    )}
                    <div className="hidden md:block">
                        <BookingSection storeId={store.id} storeName={store.name} slug={params.slug} themeColor={store.theme_color} />
                    </div>
                </div>
            </section>

            {/* Today's Schedule Section */}
            <section id="schedule" className="py-10 md:py-20 px-3 md:px-4 bg-zinc-950">
                <div className="max-w-6xl mx-auto">
                    <SectionTitle en="Today's Schedule" jp="本日の出勤セラピスト" />
                    {staffList.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
                            {staffList.map(cast => (
                                <CastCard key={cast.id} cast={cast} slug={params.slug} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-zinc-500 py-10">現在出勤情報はありません。</p>
                    )}
                </div>
            </section>

            {/* New Face Section */}
            {newFaces.length > 0 && (
                <section id="new-face" className="py-10 md:py-20 px-3 md:px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col items-center mb-8 md:mb-12">
                            <h2 className="text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-600 font-serif tracking-widest drop-shadow-sm">New Face</h2>
                            <span className="text-pink-500/70 text-xs md:text-sm mt-1.5 md:mt-2 tracking-[0.3em]">新人セラピスト</span>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-6">
                            {newFaces.map(cast => (
                                <CastCard key={cast.id} cast={cast} slug={params.slug} isNew={true} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Information (News) Section */}
            <section id="information" className="py-10 md:py-20 px-3 md:px-4 bg-zinc-900/50 relative border-y border-zinc-800">
                <div className="max-w-4xl mx-auto">
                    <SectionTitle en="Information" jp="最新情報" />
                    <div className="bg-black/50 border border-zinc-800 rounded-xl p-3 md:p-8 backdrop-blur-sm shadow-xl">
                        {activeNews.length > 0 ? (
                            <ul className="space-y-3 md:space-y-4 divide-y divide-zinc-800/50">
                                {activeNews.map(news => (
                                    <li key={news.id} className="pt-3 md:pt-4 first:pt-0 flex flex-col md:flex-row gap-3 md:gap-4 hover:bg-zinc-800/30 p-2 rounded-lg transition-colors">
                                        <div className="flex flex-col flex-1">
                                            <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                                                <span className="text-amber-500 text-[10px] md:text-xs font-mono tracking-wider border border-amber-500/30 px-1.5 md:px-2 py-0.5 rounded">
                                                    {new Date(news.published_at).toLocaleDateString('ja-JP').replace(/\//g, '.')}
                                                </span>
                                            </div>
                                            <h3 className="text-zinc-100 font-medium text-sm md:text-lg leading-snug">
                                                {news.url ? (
                                                    <a href={news.url} target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors underline decoration-zinc-700 underline-offset-4">{news.title}</a>
                                                ) : news.title}
                                            </h3>
                                            <p className="text-zinc-400 mt-1.5 md:mt-2 text-xs md:text-sm line-clamp-2">{news.content}</p>
                                        </div>
                                        {news.image_url && (
                                            <div className="w-full md:w-32 h-20 shrink-0 rounded overflow-hidden">
                                                <img src={news.image_url} alt="" className="w-full h-full object-cover opacity-80" />
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-zinc-500 py-6 md:py-8 text-sm">現在お知らせはありません。</p>
                        )}
                    </div>
                </div>
            </section>

            {/* Menu & System */}
            <section id="system" className="py-10 md:py-20 px-3 md:px-4 relative">
                 <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-zinc-900 to-[#0a0a0a] -z-10" />
                 <div className="max-w-4xl mx-auto">
                    <SectionTitle en="System & Menu" jp="料金システム・メニュー" />
                    <div className="bg-black/60 border border-amber-900/30 rounded-2xl p-4 md:p-10 backdrop-blur-md">
                        <MenuList menuItems={menuItems} />
                        
                        <div className="mt-6 md:mt-8 border-t border-zinc-800 pt-4 md:pt-6">
                             <h4 className="text-amber-500 font-bold mb-3 md:mb-4 text-sm md:text-base">■ 各種オプション・指名料について</h4>
                             <ul className="text-zinc-400 text-xs md:text-sm space-y-1.5 md:space-y-2">
                                 <li>・基本指名料: 別途各キャストのプロフィールに記載</li>
                                 <li>・深夜料金: 24:00以降のご予約は表示価格の10%増しとなります</li>
                                 <li>・お支払いは現金、または各種クレジットカードがご利用いただけます</li>
                             </ul>
                        </div>
                    </div>
                 </div>
            </section>

            {/* Access & Contact */}
            <section id="access" className="py-10 md:py-20 px-3 md:px-4 bg-zinc-950 border-t border-zinc-900">
                <div className="max-w-5xl mx-auto">
                    <SectionTitle en="Access & Contact" jp="店舗情報・アクセス" />
                    <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-stretch">
                        <div className="bg-black border border-zinc-800 rounded-xl p-5 md:p-8 flex flex-col justify-center shadow-2xl">
                             <h3 className="text-xl md:text-2xl font-serif text-amber-500 mb-4 md:mb-6">{store.name}</h3>
                             <div className="space-y-4 md:space-y-6 text-zinc-300">
                                 <div className="flex items-start gap-3 md:gap-4">
                                     <MapPin className="text-amber-600 shrink-0 mt-1 h-4 w-4 md:h-5 md:w-5" />
                                     <div>
                                         <p className="text-xs md:text-sm text-zinc-500 mb-0.5 md:mb-1">住所</p>
                                         <p className="leading-relaxed text-sm md:text-base">{store.address || 'ルームの詳細はご予約確定後にお伝えいたします。'}</p>
                                     </div>
                                 </div>
                                 <div className="flex items-start gap-3 md:gap-4">
                                     <Phone className="text-amber-600 shrink-0 mt-1 h-4 w-4 md:h-5 md:w-5" />
                                     <div>
                                         <p className="text-xs md:text-sm text-zinc-500 mb-0.5 md:mb-1">電話番号</p>
                                         <a href={`tel:${store.phone || ''}`} className="text-lg md:text-xl font-mono hover:text-amber-500 transition-colors">
                                             {store.phone || '000-0000-0000'}
                                         </a>
                                     </div>
                                 </div>
                                 <div className="flex items-start gap-3 md:gap-4">
                                     <Clock className="text-amber-600 shrink-0 mt-1 h-4 w-4 md:h-5 md:w-5" />
                                     <div>
                                         <p className="text-xs md:text-sm text-zinc-500 mb-0.5 md:mb-1">営業時間</p>
                                         <p className="text-sm md:text-base">{formatBusinessHours(store.business_days)}</p>
                                     </div>
                                 </div>
                             </div>
                        </div>
                        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden flex items-center justify-center min-h-[200px] md:min-h-[300px] relative">
                             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                             <div className="text-center z-10 p-4 md:p-6">
                                 <Navigation className="h-8 w-8 md:h-12 md:w-12 text-zinc-600 mx-auto mb-3 md:mb-4" />
                                 <p className="text-zinc-500 text-xs md:text-base">Google Map Area (Implementation requires API Key)</p>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black py-6 md:py-8 border-t border-zinc-900 text-center pb-24 md:pb-8">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="mb-4 md:mb-6 flex justify-center gap-4 md:gap-6 text-xs md:text-sm text-zinc-500">
                         <Link href="#" className="hover:text-amber-500 transition-colors">利用規約</Link>
                         <Link href="#" className="hover:text-amber-500 transition-colors">プライバシーポリシー</Link>
                         <Link href="#" className="hover:text-amber-500 transition-colors">特定商取引法に基づく表記</Link>
                    </div>
                    <p className="text-zinc-600 text-xs tracking-wider">
                        &copy; 2024 {store.name}. All Rights Reserved. 
                        {!organization?.branding?.remove_branding && ' Powered by Esthetics Booking.'}
                    </p>
                </div>
            </footer>

            {/* Mobile Bottom Navigation - Fixed */}
            <div className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-black/95 backdrop-blur-lg border-t border-zinc-800 safe-area-bottom">
                <div className="grid grid-cols-3 h-16">
                    <a
                        href={`tel:${store.phone || ''}`}
                        className="flex flex-col items-center justify-center gap-1 text-zinc-400 active:text-amber-500 transition-colors"
                    >
                        <Phone className="h-5 w-5" />
                        <span className="text-[10px] font-medium">電話</span>
                    </a>
                    <Link
                        href={`/store/${params.slug}/reserve`}
                        className="flex flex-col items-center justify-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-600 text-black mx-2 my-2 rounded-lg font-bold"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-[10px]">WEB予約</span>
                    </Link>
                    <Link
                        href="#schedule"
                        className="flex flex-col items-center justify-center gap-1 text-zinc-400 active:text-amber-500 transition-colors"
                    >
                        <Clock className="h-5 w-5" />
                        <span className="text-[10px] font-medium">出勤情報</span>
                    </Link>
                </div>
            </div>
            </div>
        </div>
    )
}

// -------------------------------------------------------------
// UI Helper Components for the Dark Theme 
// -------------------------------------------------------------

function SectionTitle({ en, jp }: { en: string, jp: string }) {
    return (
        <div className="flex flex-col items-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-600 font-serif tracking-widest drop-shadow-sm uppercase">
                {en}
            </h2>
            <span className="text-amber-600/60 text-xs md:text-sm mt-1.5 md:mt-2 tracking-[0.3em] font-medium">{jp}</span>
        </div>
    )
}

function CastCard({ cast, slug, isNew = false }: { cast: Staff, slug: string, isNew?: boolean }) {
    const mainImage = cast.avatarUrl || (cast.images && cast.images.length > 0 ? cast.images[0] : null)
    
    const gradientColors = [
        'from-rose-500 to-orange-400',
        'from-fuchsia-500 to-purple-500', 
        'from-blue-500 to-indigo-500',
        'from-emerald-400 to-teal-500'
    ]
    const randomGradient = gradientColors[String(cast.name).charCodeAt(0) % gradientColors.length]
    
    return (
        <div className="group bg-black rounded-lg md:rounded-xl overflow-hidden border border-zinc-800 hover:border-amber-500/50 transition-all duration-300 shadow-xl hover:shadow-amber-900/20 relative flex flex-col">
            {isNew && (
                <div className="absolute top-2 left-[-24px] md:left-[-30px] bg-rose-600 text-white text-[8px] md:text-[10px] font-bold py-0.5 md:py-1 px-8 md:px-10 shadow-lg transform -rotate-45 z-20 tracking-wider">
                    NEW
                </div>
            )}
            {cast.class_rank && (
                <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-gradient-to-r from-amber-600 to-yellow-400 text-black text-[9px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded shadow-lg z-20 uppercase">
                    {cast.class_rank}
                </div>
            )}
            
            {/* Image - clickable to detail */}
            <Link href={`/store/${slug}/cast/${cast.id}`} className="block aspect-[3/4] relative overflow-hidden bg-zinc-900">
                {mainImage ? (
                    <img 
                        src={mainImage} 
                        alt={cast.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                    />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${randomGradient} opacity-80 group-hover:opacity-100 transition-opacity`}>
                        <span className="text-4xl md:text-6xl text-white/50 font-serif">{cast.name.charAt(0)}</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                {/* Name + Specs Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-2 md:p-4">
                    <h3 className="text-lg md:text-2xl font-bold text-white tracking-wide mb-0.5 md:mb-1 drop-shadow-md">
                        {cast.name}
                    </h3>
                    
                    {/* Specs line like reference sites: AGE 24 T164 / B83(C) / W56 / H81 */}
                    <div className="text-[10px] md:text-xs font-mono text-zinc-300 tracking-wider">
                        {cast.age && <span>AGE {cast.age} </span>}
                        <span className="text-zinc-400">
                            {cast.height ? `T${cast.height}` : ''}
                            {(cast.bust || cast.cup) && <> / <span className="text-rose-400">B{cast.bust || '-'}{cast.cup ? `(${cast.cup})` : ''}</span></>}
                            {cast.waist && <> / W{cast.waist}</>}
                            {cast.hip && <> / H{cast.hip}</>}
                        </span>
                    </div>
                </div>
            </Link>

            {/* Card Body */}
            <div className="p-2 md:p-4 flex-1 flex flex-col">
                {/* Schedule time slot */}
                <div className="flex items-center gap-1 mb-1.5 md:mb-2 text-amber-500">
                    <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    <span className="text-[10px] md:text-xs font-medium">出勤中</span>
                </div>

                {/* Tags / Specialties */}
                {cast.specialties && cast.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5 md:mb-2">
                        {cast.specialties.slice(0, 3).map((spec) => (
                            <span key={spec} className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                {spec}
                            </span>
                        ))}
                    </div>
                )}

                {/* SNS Links */}
                <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                    {cast.twitter_url && (
                        <a href={cast.twitter_url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-sky-400 transition-colors">
                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                        </a>
                    )}
                    {cast.instagram_url && (
                        <a href={cast.instagram_url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-pink-500 transition-colors">
                            <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path></svg>
                        </a>
                    )}
                    <span className="text-[9px] md:text-xs text-zinc-500 ml-auto bg-zinc-900 px-1.5 md:px-2 py-0.5 rounded border border-zinc-800 whitespace-nowrap">
                        指名 {cast.nomination_fee ? `¥${cast.nomination_fee.toLocaleString()}` : '無料'}
                    </span>
                </div>

                {/* Greeting message */}
                <p className="text-[11px] md:text-sm text-zinc-400 line-clamp-2 leading-relaxed mb-2 md:mb-4 flex-1">
                    {cast.greeting_message || cast.bio || 'お気軽にご指名ください。'}
                </p>

                {/* Reserve Button */}
                <Button className="w-full h-8 md:h-10 bg-zinc-900 border border-zinc-700 text-amber-500 hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all font-bold text-xs md:text-sm tracking-widest mt-auto" asChild>
                    <Link href={`/store/${slug}/reserve`}>事前予約</Link>
                </Button>
            </div>
        </div>
    )
}
