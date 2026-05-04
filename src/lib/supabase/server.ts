import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

/**
 * Require authentication for server actions and API routes.
 * Returns the authenticated user and supabase client.
 * Throws an error if the user is not authenticated.
 * 
 * Usage:
 *   const { user, supabase } = await requireAuth()
 */
export async function requireAuth() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error('認証が必要です。ログインしてください。')
    }

    return { user, supabase }
}

/**
 * Require system admin authentication.
 * Returns the authenticated admin user and supabase client.
 * Throws an error if the user is not a system admin.
 */
export async function requireAdmin() {
    const { user, supabase } = await requireAuth()

    const adminEmails = (process.env.SYSTEM_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

    if (!user.email || !adminEmails.includes(user.email)) {
        throw new Error('システム管理者権限が必要です。')
    }

    return { user, supabase }
}

/**
 * Require that the authenticated user is a member of the specified organization
 * with an appropriate role.
 * 
 * @param organizationId - The organization to check membership for
 * @param requiredRoles - Optional array of roles to check (defaults to any role)
 */
export async function requireOrgMember(organizationId: string, requiredRoles?: string[]) {
    const { user, supabase } = await requireAuth()

    const query = supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .single()

    const { data: member, error } = await query

    if (error || !member) {
        throw new Error('この組織へのアクセス権がありません。')
    }

    if (requiredRoles && !requiredRoles.includes(member.role)) {
        throw new Error(`この操作には ${requiredRoles.join(' または ')} 権限が必要です。`)
    }

    return { user, supabase, role: member.role }
}
