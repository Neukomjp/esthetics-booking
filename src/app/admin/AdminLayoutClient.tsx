'use client'

import { LayoutDashboard, Building2, Users, Settings, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AdminLayoutClient({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex-shrink-0">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold">システム管理</h1>
                </div>
                <nav className="p-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                        <LayoutDashboard className="h-5 w-5" />
                        <span>ダッシュボード</span>
                    </Link>
                    <Link href="/admin/organizations" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                        <Building2 className="h-5 w-5" />
                        <span>組織一覧</span>
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                        <Users className="h-5 w-5" />
                        <span>ユーザー管理</span>
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                        <Settings className="h-5 w-5" />
                        <span>システム設定</span>
                    </Link>
                </nav>
                <div className="p-4 mt-auto border-t border-slate-800">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                        <span>アプリに戻る</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
