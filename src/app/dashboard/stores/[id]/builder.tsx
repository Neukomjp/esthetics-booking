'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { StoreData } from '@/lib/types/store'
import { updateStoreAction } from '@/lib/actions/store'
import { Loader2, Phone, Clock, MapPin } from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'

interface StorePageBuilderProps {
    store: StoreData
}

export function StorePageBuilder({ store }: StorePageBuilderProps) {
    const [loading, setLoading] = useState(false)

    // Parse existing theme_config
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingConfig = store.theme_config as any || {}

    const [designConfig, setDesignConfig] = useState({
        primaryColor: store.theme_color || '#d97706', // amber-600
        heroImage: store.cover_image_url || 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=2070&auto=format&fit=crop',
        logoUrl: store.logo_url || '',
        welcomeMessage: existingConfig.welcomeMessage || '',
        showTitle: existingConfig.showTitle !== false,
        heroTagline: existingConfig.heroTagline || '極上の癒やしと非日常の空間へ',
        about: existingConfig.about || {
            title: '私たちについて',
            content: '',
            imageUrl: ''
        },
        gallery: (existingConfig.gallery || []).filter((img: any) => typeof img === 'string' && img.trim() !== ''),
        seo: existingConfig.seo || {
            title: '',
            description: '',
            ogImage: ''
        }
    })

    const handleSave = async () => {
        setLoading(true)
        try {
            await updateStoreAction(store.id, {
                theme_color: designConfig.primaryColor,
                cover_image_url: designConfig.heroImage,
                logo_url: designConfig.logoUrl,
                theme_config: {
                    ...existingConfig,
                    welcomeMessage: designConfig.welcomeMessage,
                    showTitle: designConfig.showTitle,
                    heroTagline: designConfig.heroTagline,
                    about: designConfig.about,
                    gallery: designConfig.gallery.filter((img: any) => typeof img === 'string' && img.trim() !== ''),
                    seo: designConfig.seo,
                    updatedAt: new Date().toISOString()
                }
            })
            toast.success('デザイン設定を保存しました')
        } catch (error) {
            console.error('Failed to save design:', error)
            toast.error('保存に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Settings Panel */}
            <div className="space-y-6">
                {/* Logo */}
                <div className="grid gap-2">
                    <Label className="text-base font-bold">ロゴ画像</Label>
                    <ImageUpload
                        value={designConfig.logoUrl}
                        onChange={(url) => setDesignConfig({ ...designConfig, logoUrl: url })}
                        onRemove={() => setDesignConfig({ ...designConfig, logoUrl: '' })}
                    />
                    <p className="text-xs text-muted-foreground">ヘッダーとヒーロー画像に表示される丸型ロゴ。</p>
                </div>

                {/* Accent Color */}
                <div className="grid gap-2">
                    <Label className="text-base font-bold">アクセントカラー</Label>
                    <div className="flex gap-2">
                        <Input
                            type="color"
                            value={designConfig.primaryColor}
                            onChange={(e) => setDesignConfig({ ...designConfig, primaryColor: e.target.value })}
                            className="w-12 h-10 p-1"
                        />
                        <Input
                            value={designConfig.primaryColor}
                            onChange={(e) => setDesignConfig({ ...designConfig, primaryColor: e.target.value })}
                            className="flex-1"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">予約ボタンやハイライト部分のカラー。</p>
                </div>

                <div className="flex items-center space-x-2">
                    <Switch
                        id="show-title"
                        checked={designConfig.showTitle}
                        onCheckedChange={(checked) => setDesignConfig({ ...designConfig, showTitle: checked })}
                    />
                    <Label htmlFor="show-title">ストア名を表示する</Label>
                </div>

                <div className="border-t pt-4 space-y-4">
                    <h3 className="font-bold text-base">ヒーローセクション</h3>
                    <div className="grid gap-2">
                        <Label>カバー画像</Label>
                        <ImageUpload
                            value={designConfig.heroImage}
                            onChange={(url) => setDesignConfig({ ...designConfig, heroImage: url })}
                        />
                        <p className="text-xs text-muted-foreground">ページ最上部に表示される大きなバナー画像。</p>
                    </div>
                    <div className="grid gap-2">
                        <Label>ヒーローキャッチコピー</Label>
                        <Input
                            value={designConfig.heroTagline}
                            onChange={(e) => setDesignConfig({ ...designConfig, heroTagline: e.target.value })}
                            placeholder="極上の癒やしと非日常の空間へ"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>ウェルカムメッセージ</Label>
                        <Textarea
                            value={designConfig.welcomeMessage}
                            onChange={(e) => setDesignConfig({ ...designConfig, welcomeMessage: e.target.value })}
                            placeholder="厳選されたセラピスト達の洗練されたリラクゼーションをお楽しみください..."
                            rows={3}
                        />
                        <p className="text-xs text-muted-foreground">キャッチコピーの下に小さく表示されます。</p>
                    </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                    <h3 className="font-bold text-base">ギャラリー画像</h3>
                    <p className="text-xs text-muted-foreground">店舗の雰囲気やルーム写真を追加してください。</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {designConfig.gallery.map((img: string, index: number) => (
                            <div key={img + index} className="grid gap-2">
                                <Label>画像 {index + 1}</Label>
                                <ImageUpload
                                    value={img}
                                    onChange={(url) => {
                                        const newGallery = [...designConfig.gallery]
                                        newGallery[index] = url
                                        setDesignConfig({ ...designConfig, gallery: newGallery })
                                    }}
                                    onRemove={() => {
                                        const newGallery = designConfig.gallery.filter((_: string, i: number) => i !== index)
                                        setDesignConfig({ ...designConfig, gallery: newGallery })
                                    }}
                                />
                            </div>
                        ))}
                        <div className="grid gap-2">
                            <Label>新しい画像を追加</Label>
                            <ImageUpload
                                onChange={(url) => {
                                    setDesignConfig({ ...designConfig, gallery: [...designConfig.gallery, url] })
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                    <h3 className="font-bold text-base">SEO & SNSシェア設定</h3>
                    <div className="grid gap-2">
                        <Label>ページタイトル (Title)</Label>
                        <Input
                            value={designConfig.seo?.title || ''}
                            onChange={(e) => setDesignConfig({ ...designConfig, seo: { ...designConfig.seo, title: e.target.value } })}
                            placeholder={store.name}
                        />
                        <p className="text-xs text-muted-foreground">ブラウザのタブや検索結果のタイトル。未入力の場合は店舗名が使用されます。</p>
                    </div>
                    <div className="grid gap-2">
                        <Label>説明文 (Meta Description)</Label>
                        <Textarea
                            value={designConfig.seo?.description || ''}
                            onChange={(e) => setDesignConfig({ ...designConfig, seo: { ...designConfig.seo, description: e.target.value } })}
                            placeholder="店舗の魅力や特徴を100文字程度で入力してください..."
                            rows={3}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>シェア用画像 (OGP Image)</Label>
                        <ImageUpload
                            value={designConfig.seo?.ogImage || ''}
                            onChange={(url) => setDesignConfig({ ...designConfig, seo: { ...designConfig.seo, ogImage: url } })}
                            onRemove={() => setDesignConfig({ ...designConfig, seo: { ...designConfig.seo, ogImage: '' } })}
                        />
                        <p className="text-xs text-muted-foreground">SNSでシェアされた際に表示される画像。</p>
                    </div>
                </div>

                <Button onClick={handleSave} className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    保存する
                </Button>
            </div>

            {/* Preview Area - Dark Theme */}
            <div className="border border-zinc-300 rounded-lg overflow-hidden bg-zinc-950 h-[700px] relative sticky top-4">
                <div className="absolute top-0 w-full bg-zinc-900 text-zinc-300 text-xs px-3 py-1.5 flex justify-between items-center z-10 border-b border-zinc-800">
                    <span>プレビュー: モバイル表示</span>
                    <span className="text-[10px] text-zinc-500">Dark Luxury Theme</span>
                </div>
                <div className="h-full overflow-y-auto pt-7 font-sans">
                    <div className="bg-[#0a0a0a] min-h-[600px] text-zinc-300">
                        {/* Hero Preview */}
                        <div className="h-48 bg-zinc-800 bg-cover bg-center relative" style={{ backgroundImage: `url(${designConfig.heroImage})` }}>
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0a0a0a]" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                                {designConfig.logoUrl && (
                                    <div className="w-14 h-14 rounded-full border border-amber-500/50 overflow-hidden mb-2 shadow-lg">
                                        <img src={designConfig.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                {designConfig.showTitle && (
                                    <div className="text-base font-bold bg-gradient-to-r from-amber-200 to-yellow-600 bg-clip-text text-transparent mb-1">
                                        {store.name}
                                    </div>
                                )}
                                <div className="text-white text-sm font-serif tracking-wider leading-snug">
                                    {designConfig.heroTagline || '極上の癒やしと非日常の空間へ'}
                                </div>
                                {designConfig.welcomeMessage && (
                                    <p className="text-zinc-400 text-[9px] mt-1 max-w-[200px] line-clamp-2">{designConfig.welcomeMessage}</p>
                                )}
                            </div>
                        </div>

                        <div className="px-3 space-y-4 pb-6">
                            {/* Today's Schedule Preview */}
                            <div className="pt-4">
                                <div className="text-center mb-3">
                                    <div className="text-sm font-serif tracking-widest bg-gradient-to-r from-amber-200 to-yellow-600 bg-clip-text text-transparent uppercase">Today&apos;s Schedule</div>
                                    <div className="text-[9px] text-amber-600/60 tracking-[0.2em]">本日の出勤セラピスト</div>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="bg-black rounded-md overflow-hidden border border-zinc-800">
                                            <div className="aspect-[3/4] bg-zinc-800 relative">
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                                <div className="absolute bottom-1 left-1.5">
                                                    <div className="text-[10px] font-bold text-white">セラピスト {i}</div>
                                                    <div className="text-[7px] text-zinc-400 font-mono">AGE 24 T164</div>
                                                </div>
                                            </div>
                                            <div className="p-1.5">
                                                <div className="flex items-center gap-1 text-amber-500 text-[7px]">
                                                    <Clock className="h-2 w-2" /> 出勤中
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Menu Preview */}
                            <div>
                                <div className="text-center mb-3">
                                    <div className="text-sm font-serif tracking-widest bg-gradient-to-r from-amber-200 to-yellow-600 bg-clip-text text-transparent uppercase">System & Menu</div>
                                    <div className="text-[9px] text-amber-600/60 tracking-[0.2em]">料金システム・メニュー</div>
                                </div>
                                <div className="bg-black/60 border border-amber-900/30 rounded-lg p-2 space-y-1.5">
                                    {['80分コース', '100分コース', '120分コース'].map((name, i) => (
                                        <div key={i} className="flex items-center justify-between bg-zinc-900/80 rounded px-2.5 py-2 border border-zinc-800">
                                            <span className="text-[10px] text-zinc-100">{name}</span>
                                            <span className="text-[10px] font-bold text-amber-400">¥{(18000 + i * 4000).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Access Preview */}
                            <div>
                                <div className="text-center mb-3">
                                    <div className="text-sm font-serif tracking-widest bg-gradient-to-r from-amber-200 to-yellow-600 bg-clip-text text-transparent uppercase">Access & Contact</div>
                                    <div className="text-[9px] text-amber-600/60 tracking-[0.2em]">店舗情報・アクセス</div>
                                </div>
                                <div className="bg-black border border-zinc-800 rounded-lg p-3">
                                    <div className="text-amber-500 text-xs font-serif mb-2">{store.name}</div>
                                    <div className="space-y-1.5 text-[9px] text-zinc-400">
                                        <div className="flex items-center gap-1.5"><MapPin className="h-2.5 w-2.5 text-amber-600" /> {store.address || '住所未設定'}</div>
                                        <div className="flex items-center gap-1.5"><Phone className="h-2.5 w-2.5 text-amber-600" /> {store.phone || '000-0000-0000'}</div>
                                        <div className="flex items-center gap-1.5"><Clock className="h-2.5 w-2.5 text-amber-600" /> 営業時間</div>
                                    </div>
                                </div>
                            </div>

                            {/* Gallery Preview */}
                            {(() => {
                                const validGallery = (designConfig.gallery || []).filter((img: any) => typeof img === 'string' && img.trim() !== '')
                                if (validGallery.length === 0) return null
                                return (
                                    <div>
                                        <div className="text-center mb-2">
                                            <div className="text-[10px] font-serif text-amber-500/80 tracking-wider">GALLERY</div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1">
                                            {validGallery.slice(0, 3).map((img: string, i: number) => (
                                                <div key={i} className="aspect-square bg-zinc-800 rounded overflow-hidden">
                                                    <img src={img} alt="" className="w-full h-full object-cover opacity-80" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* Bottom Nav Preview */}
                            <div className="fixed-preview-bottom bg-black/95 border-t border-zinc-800 rounded-b-lg mt-4">
                                <div className="grid grid-cols-3 h-10">
                                    <div className="flex flex-col items-center justify-center text-zinc-400 text-[8px]">
                                        <Phone className="h-3 w-3" />電話
                                    </div>
                                    <div className="flex flex-col items-center justify-center text-black text-[8px] font-bold rounded m-1" style={{ background: `linear-gradient(to right, ${designConfig.primaryColor}, #eab308)` }}>
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        WEB予約
                                    </div>
                                    <div className="flex flex-col items-center justify-center text-zinc-400 text-[8px]">
                                        <Clock className="h-3 w-3" />出勤情報
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
