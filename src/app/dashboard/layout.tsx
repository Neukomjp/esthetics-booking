import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    LayoutDashboard,
    Store,
    Calendar,
    Settings,
    CreditCard,
    Users,
    Ticket,
    Menu
} from 'lucide-react'
import { OrganizationSwitcher } from '@/components/organization-switcher'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { LogoutButton } from '@/components/logout-button'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserOrganizationsAction } from '@/lib/actions/organization'
import { canViewStores, canViewCustomers, canViewCoupons, canViewPayments, canManageSettings } from '@/lib/rbac'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const orgs = await getUserOrganizationsAction()

    if (orgs.length === 0) {
        redirect('/onboarding')
    }

    const orgId = (await cookies()).get('organization-id')?.value || orgs[0]?.id

    // Find current org to get role
    const currentOrg = orgs.find(o => o.id === orgId) || orgs[0]
    const role = currentOrg?.role || 'member'

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-[#f5f5f5]">
            {/* Sidebar (Desktop) */}
            <aside className="w-[200px] bg-white border-r border-gray-200 hidden md:flex flex-col shrink-0">
                <div className="p-4 border-b border-gray-100">
                    <Link href="/dashboard" className="flex items-center gap-2 mb-2">
                        <h1 className="text-base font-bold text-gray-800 tracking-tight">サロン予約システム</h1>
                    </Link>
                    <OrganizationSwitcher currentOrgId={orgId} />
                </div>
                <div className="py-2 flex-1 overflow-y-auto">
                    <SidebarNav role={role as any} />
                </div>
                <div className="p-4 border-t border-gray-200">
                    <LogoutButton />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 bg-white border-b shrink-0">
                    <Link href="/dashboard" className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        サロン予約システム
                    </Link>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
                            <SheetTitle className="sr-only">ナビゲーションメニュー</SheetTitle>
                            <div className="p-6 pb-2">
                                <Link href="/dashboard" className="flex items-center gap-2 mb-4">
                                    <span className="text-xl font-bold text-gray-800">サロン予約システム</span>
                                </Link>
                                <OrganizationSwitcher currentOrgId={orgId} />
                            </div>
                            <div className="py-2 flex-1 overflow-y-auto">
                                <SidebarNav role={role as any} />
                            </div>
                            <div className="p-4 border-t mt-auto border-gray-200">
                                <LogoutButton />
                            </div>
                        </SheetContent>
                    </Sheet>
                </header>

                <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
