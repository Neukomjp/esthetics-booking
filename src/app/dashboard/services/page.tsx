import { storeService } from '@/lib/services/stores'
import { menuService } from '@/lib/services/menu'
import { StoreSelector } from '@/app/dashboard/bookings/store-selector'
import { cookies } from 'next/headers'
import { ServiceList } from './service-list'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ServicesPage(props: Props) {
    const searchParams = await props.searchParams;
    const urlStoreId = searchParams.store as string | undefined;

    let storeId = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stores: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let services: any[] = [];

    const cookieStore = await cookies()
    const organizationId = cookieStore.get('organization-id')?.value

    try {
        stores = await storeService.getStores(organizationId);
        if (stores.length > 0) {
            storeId = urlStoreId && stores.find(s => s.id === urlStoreId) ? urlStoreId : stores[0].id;
            services = await menuService.getServicesByStoreId(storeId);
        }
    } catch (error) {
        console.error('Failed to fetch services:', error);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">料金システム（コース）</h2>
                    <StoreSelector stores={stores} currentStoreId={storeId} />
                </div>
            </div>
            
            <ServiceList initialServices={services} storeId={storeId} />
        </div>
    )
}
