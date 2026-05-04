'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Store,
    Calendar,
    Settings,
    CreditCard,
    Users,
    Ticket,
    Briefcase,
    Clock,
    MonitorPlay
} from 'lucide-react'
import { canViewStores, canViewCustomers, canViewCoupons, canViewPayments, canManageSettings } from '@/lib/rbac'

interface SidebarNavProps {
    role: string;
}

export function SidebarNav({ role }: SidebarNavProps) {
    const pathname = usePathname();

    const navItems = [
        { href: '/dashboard', label: 'ホーム', icon: LayoutDashboard, show: true },
        { href: '/dashboard/schedules', label: 'スケジュール', icon: Clock, show: true },
        { href: '/dashboard/shifts', label: 'シフト', icon: Briefcase, show: true },
        { href: '/dashboard/bookings', label: '予約', icon: Calendar, show: true },
        { href: '/dashboard/customers', label: '顧客', icon: Users, show: canViewCustomers(role as any) },
        { href: '/dashboard/staff', label: 'キャスト', icon: Users, show: true },
        { href: '/dashboard/services', label: '料金システム', icon: CreditCard, show: true },
        { href: '/dashboard/stores', label: '店舗', icon: Store, show: canViewStores(role as any) },
        { href: '/dashboard/coupons', label: 'クーポン', icon: Ticket, show: canViewCoupons(role as any) },
        { href: '/dashboard/payments', label: '決済・売上', icon: CreditCard, show: canViewPayments(role as any) },
        { href: '/dashboard/settings', label: '設定', icon: Settings, show: canManageSettings(role as any) },
    ];

    return (
        <nav className="flex-1 space-y-0.5 overflow-y-auto">
            {navItems.filter(item => item.show).map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                // exception for home
                const isExactHome = item.href === '/dashboard' && pathname === '/dashboard';
                const actuallyActive = item.href === '/dashboard' ? isExactHome : isActive;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center px-4 py-2.5 text-[13px] font-medium transition-colors border-l-4 ${
                            actuallyActive
                                ? 'border-[#4CAF50] text-[#4CAF50] bg-green-50/50'
                                : 'border-transparent text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        {item.label}
                    </Link>
                )
            })}
        </nav>
    )
}
