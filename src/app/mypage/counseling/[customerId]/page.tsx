import { PatientCounselingClient } from '@/components/counseling/patient-counseling-client'
import { getMyCounselingCustomerAction } from '@/lib/actions/counseling-sheet'

export default async function MyCounselingPage({ params }: { params: Promise<{ customerId: string }> }) {
    const { customerId } = await params
    const customer = await getMyCounselingCustomerAction(customerId)
    return <PatientCounselingClient customer={customer} />
}
