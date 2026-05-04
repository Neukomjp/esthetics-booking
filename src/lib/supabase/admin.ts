/**
 * Supabase Admin Client
 * 
 * SECURITY: This client uses the Service Role Key and bypasses ALL RLS policies.
 * It must ONLY be used in server-side code (API routes, server actions, webhooks)
 * for operations that genuinely require elevated privileges.
 * 
 * NEVER import this file from client components or client-side code.
 * NEVER expose the Service Role Key to the browser.
 */
import { createClient } from '@supabase/supabase-js'

let adminClient: ReturnType<typeof createClient> | null = null

/**
 * Get the Supabase admin client (singleton).
 * Uses Service Role Key to bypass RLS - use with extreme caution.
 * 
 * @throws Error if SUPABASE_SERVICE_ROLE_KEY is not set
 */
export function getAdminClient() {
    if (adminClient) return adminClient

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
            'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
            'Admin operations require the service role key to be configured.'
        )
    }

    adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })

    return adminClient
}
