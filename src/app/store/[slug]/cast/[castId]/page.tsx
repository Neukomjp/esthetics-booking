/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Phone, Clock, MapPin, Heart } from 'lucide-react'
import { storeService } from '@/lib/services/stores'
import { staffService } from '@/lib/services/staff'
import { Staff } from '@/types/staff'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(props: { params: Promise<{ slug: string; castId: string }> }): Promise<Metadata> {
    const params = await props.params
    try {
        const supabase = await createClient()
        const store = await storeService.getStoreBySlug(params.slug, supabase)
        const cast = await staffService.getStaffById(params.castId, supabase)
        return {
            title: `${cast.name} | ${store?.name || 'セラピスト'}`,
            description: cast.greeting_message || cast.bio || `${cast.name}のプロフィール`,
        }
    } catch {
        return { title: 'セラピスト' }
    }
}

export default async function CastDetailPage(props: { params: Promise<{ slug: string; castId: string }> }) {
    const params = await props.params
    let store: any
    let cast: Staff

    try {
        const supabase = await createClient()
        store = await storeService.getStoreBySlug(params.slug, supabase)
        cast = await staffService.getStaffById(params.castId, supabase)
    } catch (error) {
        console.error('Error fetching cast data:', error)
        notFound()
    }

    if (!store || !cast) {
        notFound()
    }

    const allImages = cast.images && cast.images.length > 0 
        ? cast.images 
        : cast.avatarUrl 
            ? [cast.avatarUrl] 
            : []

    const gradientColors = [
        'from-rose-500 to-orange-400',
        'from-fuchsia-500 to-purple-500',
        'from-blue-500 to-indigo-500',
        'from-emerald-400 to-teal-500'
    ]
    const randomGradient = gradientColors[String(cast.name).charCodeAt(0) % gradientColors.length]

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-amber-500/30">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 z-50 bg-black/90 backdrop-blur-md border-b border-zinc-800">
                <div className="max-w-6xl mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <Link href={`/store/${params.slug}`} className="text-zinc-400 hover:text-amber-500 transition-colors p-1">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        {store.logo_url && <img src={store.logo_url} alt="Logo" className="h-8 w-8 rounded-full object-cover" />}
                        <h1 className="text-base md:text-xl font-bold bg-gradient-to-r from-amber-200 to-yellow-600 bg-clip-text text-transparent truncate max-w-[180px] md:max-w-none">
                            {store.name}
                        </h1>
                    </div>
                    <div className="hidden md:block">
                        <Button size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold hover:brightness-110 border-none" asChild>
                            <Link href={`/store/${params.slug}/reserve`}>WEB予約</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mt-14 md:mt-16 pb-24 md:pb-8">
                <div className="max-w-4xl mx-auto">
                    {/* Photo Gallery */}
                    <div className="relative">
                        {allImages.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-0.5 md:gap-1">
                                {allImages.map((img, idx) => (
                                    <div key={idx} className={`aspect-[3/4] relative overflow-hidden ${idx === 0 ? 'col-span-2 row-span-2 md:col-span-2 md:row-span-2' : ''}`}>
                                        <img
                                            src={img}
                                            alt={`${cast.name} ${idx + 1}`}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`aspect-[4/3] md:aspect-[16/9] w-full flex items-center justify-center bg-gradient-to-br ${randomGradient}`}>
                                <span className="text-8xl text-white/40 font-serif">{cast.name.charAt(0)}</span>
                            </div>
                        )}

                        {/* Name overlay on gallery */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 md:p-8">
                            <div className="flex items-end gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {cast.is_new_face && (
                                            <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">NEW</span>
                                        )}
                                        {cast.class_rank && (
                                            <span className="bg-gradient-to-r from-amber-600 to-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                {cast.class_rank}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-bold text-white tracking-wide drop-shadow-lg">
                                        {cast.name}
                                    </h2>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Content */}
                    <div className="px-4 md:px-8">
                        {/* Specs Bar */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 -mt-4 relative z-10 shadow-2xl">
                            <div className="flex flex-wrap items-center justify-center gap-x-4 md:gap-x-8 gap-y-2 text-center">
                                {cast.age && (
                                    <div>
                                        <span className="text-[10px] md:text-xs text-zinc-500 block">AGE</span>
                                        <span className="text-lg md:text-xl font-bold text-white">{cast.age}</span>
                                    </div>
                                )}
                                {cast.height && (
                                    <div>
                                        <span className="text-[10px] md:text-xs text-zinc-500 block">HEIGHT</span>
                                        <span className="text-lg md:text-xl font-bold text-white">T{cast.height}</span>
                                    </div>
                                )}
                                {(cast.bust || cast.cup) && (
                                    <div>
                                        <span className="text-[10px] md:text-xs text-zinc-500 block">BUST</span>
                                        <span className="text-lg md:text-xl font-bold text-rose-400">
                                            B{cast.bust || '-'}{cast.cup ? `(${cast.cup})` : ''}
                                        </span>
                                    </div>
                                )}
                                {cast.waist && (
                                    <div>
                                        <span className="text-[10px] md:text-xs text-zinc-500 block">WAIST</span>
                                        <span className="text-lg md:text-xl font-bold text-white">W{cast.waist}</span>
                                    </div>
                                )}
                                {cast.hip && (
                                    <div>
                                        <span className="text-[10px] md:text-xs text-zinc-500 block">HIP</span>
                                        <span className="text-lg md:text-xl font-bold text-white">H{cast.hip}</span>
                                    </div>
                                )}
                            </div>

                            {/* Nomination Fee */}
                            <div className="mt-3 pt-3 border-t border-zinc-800 text-center">
                                <span className="text-xs text-zinc-500">指名料</span>
                                <span className="ml-2 text-amber-400 font-bold text-lg">
                                    {cast.nomination_fee ? `¥${cast.nomination_fee.toLocaleString()}` : '無料'}
                                </span>
                            </div>
                        </div>

                        {/* SNS Links */}
                        {(cast.twitter_url || cast.instagram_url) && (
                            <div className="flex items-center justify-center gap-4 mt-4 md:mt-6">
                                {cast.twitter_url && (
                                    <a href={cast.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-sky-400 transition-colors bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                                        <span className="text-xs">X (Twitter)</span>
                                    </a>
                                )}
                                {cast.instagram_url && (
                                    <a href={cast.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-pink-500 transition-colors bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path></svg>
                                        <span className="text-xs">Instagram</span>
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Tags / Specialties */}
                        {cast.specialties && cast.specialties.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2 mt-4 md:mt-6">
                                {cast.specialties.map((spec) => (
                                    <span key={spec} className="text-xs px-3 py-1 rounded-full bg-zinc-900 text-amber-400 border border-amber-900/30">
                                        {spec}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Greeting Message */}
                        {cast.greeting_message && (
                            <div className="mt-6 md:mt-8 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 md:p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Heart className="h-4 w-4 text-rose-500" />
                                    <h3 className="text-sm font-bold text-amber-500">ご挨拶</h3>
                                </div>
                                <p className="text-sm md:text-base text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                    {cast.greeting_message}
                                </p>
                            </div>
                        )}

                        {/* Bio / Description */}
                        {cast.bio && (
                            <div className="mt-4 md:mt-6 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 md:p-6">
                                <h3 className="text-sm font-bold text-amber-500 mb-3">プロフィール</h3>
                                <p className="text-sm md:text-base text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                    {cast.bio}
                                </p>
                            </div>
                        )}

                        {/* Additional Info */}
                        <div className="mt-4 md:mt-6 grid grid-cols-2 gap-3">
                            {cast.years_of_experience && (
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 md:p-4 text-center">
                                    <span className="text-xs text-zinc-500 block">経験年数</span>
                                    <span className="text-lg font-bold text-white">{cast.years_of_experience}年</span>
                                </div>
                            )}
                            {cast.role && (
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 md:p-4 text-center">
                                    <span className="text-xs text-zinc-500 block">役職</span>
                                    <span className="text-lg font-bold text-white">{cast.role}</span>
                                </div>
                            )}
                        </div>

                        {/* Reserve CTA */}
                        <div className="mt-8 md:mt-10">
                            <Button className="w-full h-12 md:h-14 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold text-base md:text-lg tracking-widest hover:brightness-110 border-none rounded-xl shadow-lg shadow-amber-900/30" asChild>
                                <Link href={`/store/${params.slug}/reserve`}>
                                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    この人を予約する
                                </Link>
                            </Button>
                        </div>

                        {/* Back to store link */}
                        <div className="mt-6 text-center">
                            <Link href={`/store/${params.slug}`} className="text-sm text-zinc-500 hover:text-amber-500 transition-colors underline underline-offset-4 decoration-zinc-700">
                                ← {store.name} のトップに戻る
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-black/95 backdrop-blur-lg border-t border-zinc-800">
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
                        href={`/store/${params.slug}`}
                        className="flex flex-col items-center justify-center gap-1 text-zinc-400 active:text-amber-500 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="text-[10px] font-medium">トップ</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
