/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from 'next/navigation'
import { storeService } from '@/lib/services/stores'
import { ReserveClient } from './reserve-client'

interface ReservePageProps {
    params: Promise<{ slug: string }>
}

export default async function ReservePage({ params }: ReservePageProps) {
    const { slug } = await params
    const store = await storeService.getStoreBySlug(slug)

    if (!store) {
        notFound()
    }

    const theme = store.theme_config as any || {}

    return (
        <ReserveClient
            store={{
                id: store.id,
                name: store.name,
                slug: slug,
                themeColor: store.theme_color || '#d97706',
                logoUrl: store.logo_url || '',
                bgColor: theme.bgColor || '#0a0a0a',
                headerBgColor: theme.headerBgColor || '#000000',
                textColor: theme.textColor || '#d4d4d8',
                cardBgColor: theme.cardBgColor || '#000000',
            }}
        />
    )
}
