import { cookies } from 'next/headers'
import { regionService } from '@/lib/services/regions'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { RegionsClient } from './regions-client'

export const dynamic = 'force-dynamic'

export default async function RegionsPage() {
    const cookieStore = await cookies()
    let organizationId = cookieStore.get('organization-id')?.value
    if (!organizationId) {
        const { getUserOrganizationsAction } = await import('@/lib/actions/organization')
        const orgs = await getUserOrganizationsAction()
        organizationId = orgs[0]?.id
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let regions: any[] = []
    
    if (organizationId) {
        try {
            regions = await regionService.getRegions(organizationId)
        } catch (error) {
            console.error('Failed to fetch regions:', error)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">エリア・リージョン管理</h2>
                </div>
            </div>

            <RegionsClient initialRegions={regions} organizationId={organizationId} />
        </div>
    )
}
