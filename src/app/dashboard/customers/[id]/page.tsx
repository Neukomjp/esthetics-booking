import { notFound } from 'next/navigation'
import { customerService } from '@/lib/services/customers'
import { getVisitRecordsAction } from '@/lib/actions/visit'
import { CustomerDetails } from './customer-details'

interface CustomerPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function CustomerPage({ params }: CustomerPageProps) {
    const { id } = await params
    const customer = await customerService.getCustomerById(id)

    if (!customer) {
        notFound()
    }

    // Fetch visit records
    const visitRecords = await getVisitRecordsAction(customer.store_id, id)

    return (
        <CustomerDetails
            customer={customer}
            visitRecords={visitRecords}
        />
    )
}
