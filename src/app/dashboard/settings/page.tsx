'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrganizationSettings } from './organization-settings'
import { useCurrentOrganization } from '@/hooks/use-current-organization'
import { canManageSettings } from '@/lib/rbac'

export default function SettingsPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(true)
    const { organization, loading: orgLoading } = useCurrentOrganization()

    useEffect(() => {
        const supabase = createClient()
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user && user.email) {
                setEmail(user.email)
            }
            setLoading(false)
        }
        getUser()
    }, [])

    const handleUpdateProfile = () => {
        toast.info('プロフィールの更新機能は現在開発中です')
    }

    if (loading || orgLoading) {
        return <div className="p-8">読み込み中...</div>
    }

    if (organization && !canManageSettings(organization.role)) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200 mt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">アクセス権限がありません</h3>
                <p className="text-gray-500">設定ページを表示する権限がありません。管理者にお問い合わせください。</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">設定</h2>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile">アカウント</TabsTrigger>
                    <TabsTrigger value="organization">組織設定</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6">
                        <div className="mb-6 pb-4 border-b border-gray-100">
                            <h3 className="text-[16px] font-bold text-gray-800">アカウント設定</h3>
                            <p className="text-[13px] text-gray-500 mt-1">あなたのアカウント情報を管理します。</p>
                        </div>
                        
                        <div className="space-y-4 max-w-md">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-[13px] font-bold">メールアドレス</Label>
                                <Input id="email" value={email} disabled className="h-8 text-[13px] bg-gray-50" />
                                <p className="text-[11px] text-gray-500">メールアドレスの変更は現在サポートされていません。</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleUpdateProfile} className="h-8 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold">変更を保存</Button>
                    </div>
                </TabsContent>

                <TabsContent value="organization">
                    <OrganizationSettings />
                </TabsContent>
            </Tabs>
        </div>
    )
}
