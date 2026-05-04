-- ==============================================================================
-- Supabase RLS Patch - Demo Org Hardening
-- Date: 2026-04-22
-- Purpose: Demo org のデータが匿名(未認証)ユーザーに公開されないようにする
-- ==============================================================================
-- 実行場所: Supabase Dashboard > SQL Editor
-- ==============================================================================

-- 1. organizations: demo org を認証済みユーザーのみに制限
DROP POLICY IF EXISTS "org_select" ON organizations;
CREATE POLICY "org_select" ON organizations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
    )
    OR (
        auth.uid() IS NOT NULL
        AND id = '11111111-1111-1111-1111-111111111111'
    )
);

-- 2. stores: demo org の非公開ストアを認証済みユーザーのみに制限
--    (is_published=true のストアは引き続き公開)
DROP POLICY IF EXISTS "stores_org_select" ON stores;
CREATE POLICY "stores_org_select" ON stores FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = stores.organization_id
        AND organization_members.user_id = auth.uid()
    )
    OR (
        auth.uid() IS NOT NULL
        AND organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- 3. customers: demo org の顧客データを認証済みユーザーのみに制限
DROP POLICY IF EXISTS "customers_org_select" ON customers;
CREATE POLICY "customers_org_select" ON customers FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = customers.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = customers.store_id
            AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
        )
    )
);

-- 4. visit_records: demo org の来店記録を認証済みユーザーのみに制限
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

-- 5. customer_tickets: demo org のチケットデータを認証済みユーザーのみに制限
DROP POLICY IF EXISTS "customer_tickets_select" ON customer_tickets;
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

-- ==============================================================================
-- 完了: 上記により、demo org のデータは認証済みユーザーにのみ表示されます。
-- 匿名ユーザー(anon key のみ)では demo org のデータにアクセスできなくなります。
-- ==============================================================================
