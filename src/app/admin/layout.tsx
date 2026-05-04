import { requireAdmin } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLayoutClient from './AdminLayoutClient'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Server-side admin authorization check
    try {
        await requireAdmin()
    } catch {
        redirect('/dashboard')
    }

    return <AdminLayoutClient>{children}</AdminLayoutClient>
}
