export type Staff = {
    id: string
    storeId?: string // Deprecated
    storeIds?: string[] // Replaces storeId for multi-store support
    name: string
    role: string
    bio: string
    avatarUrl?: string
    specialties: string[]
    serviceIds?: string[] // IDs of services this staff can perform
    instagram_url?: string
    greeting_message?: string
    years_of_experience?: number
    tags?: string[]
    images?: string[] // Up to 15 images
    back_margin_rate?: number
    user_id?: string
    nomination_fee?: number
    age?: number
    height?: number
    bust?: number
    cup?: string
    waist?: number
    hip?: number
    class_rank?: string
    twitter_url?: string
    is_new_face?: boolean
}

export type Service = {
    id: string
    name: string
    duration_minutes: number
    price: number
    category?: string
    description?: string // Added for detailed menu info
    buffer_time_before?: number // minutes
    buffer_time_after?: number // minutes
    image_url?: string
    order_index?: number
}

export type ServiceOption = {
    id: string
    service_id?: string | null // Nullable for global options
    store_id: string // New field for global scope
    name: string
    price: number
    duration_minutes: number
}
