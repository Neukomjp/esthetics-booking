-- ==============================================================================
-- Supabase RLS Patch - Fix remaining SELECT leaks
-- Date: 2026-04-08
-- ==============================================================================
-- These tables expose data via the demo org fallback where they shouldn't.
-- The demo org fallback is needed for MANAGEMENT (insert/update/delete by org members)
-- but SELECT for private tables should NOT include it for anonymous users.
-- ==============================================================================

-- ============================================================================
-- 1. FIX: customers - should NOT be publicly readable (except self-view)
-- ============================================================================

-- Drop the current permissive org select policy
DROP POLICY IF EXISTS "customers_org_select" ON customers;

-- Recreate: only org members can see customers (requires authenticated user)
CREATE POLICY "customers_org_select" ON customers FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = customers.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR (
        -- Demo org fallback requires authenticated user
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = customers.store_id
            AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
        )
    )
);

-- ============================================================================
-- 2. FIX: organizations - demo org visible only to authenticated users
-- ============================================================================

DROP POLICY IF EXISTS "org_select" ON organizations;

CREATE POLICY "org_select" ON organizations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
    )
    OR (
        -- Demo org only visible to authenticated users
        auth.uid() IS NOT NULL
        AND id = '11111111-1111-1111-1111-111111111111'
    )
);

-- ============================================================================
-- 3. FIX: visit_records - demo org only for authenticated users
-- ============================================================================

DROP POLICY IF EXISTS "visits_org_select" ON visit_records;

CREATE POLICY "visits_org_select" ON visit_records FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = visit_records.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = visit_records.store_id
            AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
        )
    )
);

-- ============================================================================
-- 4. FIX: customer_tickets - demo org only for authenticated users
-- ============================================================================

DROP POLICY IF EXISTS "cust_tickets_org_select" ON customer_tickets;

CREATE POLICY "cust_tickets_org_select" ON customer_tickets FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM customers
        JOIN stores ON customers.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE customers.id = customer_tickets.customer_id
        AND organization_members.user_id = auth.uid()
    )
    OR (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM customers
            JOIN stores ON customers.store_id = stores.id
            WHERE customers.id = customer_tickets.customer_id
            AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
        )
    )
);

-- ============================================================================
-- 5. FIX: organization_members - already correct (user_id = auth.uid())
--    The "0 rows" result is actually correct behavior (no rows match anon)
-- ============================================================================
-- No change needed.

-- ============================================================================
-- 6. FIX: profiles - already correct (id = auth.uid())
--    The "0 rows" result is actually correct behavior (no rows match anon)
-- ============================================================================
-- No change needed.

-- ============================================================================
-- DONE
-- ============================================================================
