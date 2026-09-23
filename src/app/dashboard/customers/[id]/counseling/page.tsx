import { StaffCounselingClient } from '@/components/counseling/staff-counseling-client'
import { getStaffCounselingCustomerAction } from '@/lib/actions/counseling-sheet'

export default async function StaffCounselingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const customer = await getStaffCounselingCustomerAction(id)
    return <StaffCounselingClient customer={customer} />
}
