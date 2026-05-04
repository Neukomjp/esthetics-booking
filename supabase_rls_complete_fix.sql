-- ==============================================================================
-- Supabase RLS Complete Fix
-- Date: 2026-04-08
-- Description: Comprehensive Row-Level Security fix for ALL tables.
--              Drops ALL existing policies and recreates them with proper security.
-- ==============================================================================
-- IMPORTANT: Execute this ENTIRE script in Supabase Dashboard > SQL Editor
-- ==============================================================================

-- ============================================================================
-- PHASE 1: ENABLE RLS ON ALL TABLES (idempotent)
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_shift_exceptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PHASE 2: DROP ALL EXISTING POLICIES (clean slate)
-- ============================================================================

-- organizations
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete their organizations" ON organizations;

-- organization_members
DROP POLICY IF EXISTS "Users can view their memberships" ON organization_members;
DROP POLICY IF EXISTS "Users can insert memberships" ON organization_members;
DROP POLICY IF EXISTS "Users can delete memberships" ON organization_members;

-- stores
DROP POLICY IF EXISTS "Merchants can view own stores" ON stores;
DROP POLICY IF EXISTS "Merchants can insert own stores" ON stores;
DROP POLICY IF EXISTS "Merchants can update own stores" ON stores;
DROP POLICY IF EXISTS "Merchants can delete own stores" ON stores;
DROP POLICY IF EXISTS "Public can view published stores" ON stores;
DROP POLICY IF EXISTS "Users can view stores in their org" ON stores;
DROP POLICY IF EXISTS "Users can manage stores in their org" ON stores;
DROP POLICY IF EXISTS "Users can insert stores in their org" ON stores;

-- staff
DROP POLICY IF EXISTS "Public can view staff" ON staff;
DROP POLICY IF EXISTS "Merchants can manage staff" ON staff;
DROP POLICY IF EXISTS "Public can view staff of published stores" ON staff;
DROP POLICY IF EXISTS "Users can insert staff for their stores" ON staff;
DROP POLICY IF EXISTS "Users can update staff for their stores" ON staff;
DROP POLICY IF EXISTS "Users can delete staff for their stores" ON staff;

-- staff_shifts
DROP POLICY IF EXISTS "Public can view shifts" ON staff_shifts;
DROP POLICY IF EXISTS "Merchants can manage shifts" ON staff_shifts;
DROP POLICY IF EXISTS "Public can view staff shifts" ON staff_shifts;
DROP POLICY IF EXISTS "Users can insert staff shifts for their stores" ON staff_shifts;
DROP POLICY IF EXISTS "Users can update staff shifts for their stores" ON staff_shifts;
DROP POLICY IF EXISTS "Users can delete staff shifts for their stores" ON staff_shifts;

-- staff_shift_exceptions
DROP POLICY IF EXISTS "Public can view staff shift exceptions" ON staff_shift_exceptions;
DROP POLICY IF EXISTS "Public can view shift exceptions" ON staff_shift_exceptions;
DROP POLICY IF EXISTS "Authenticated can manage shift exceptions" ON staff_shift_exceptions;
DROP POLICY IF EXISTS "Users can insert staff shift exceptions for their stores" ON staff_shift_exceptions;
DROP POLICY IF EXISTS "Users can update staff shift exceptions for their stores" ON staff_shift_exceptions;
DROP POLICY IF EXISTS "Users can delete staff shift exceptions for their stores" ON staff_shift_exceptions;

-- services
DROP POLICY IF EXISTS "Public can view services of published stores" ON services;
DROP POLICY IF EXISTS "Users can insert services for their stores" ON services;
DROP POLICY IF EXISTS "Users can update services for their stores" ON services;
DROP POLICY IF EXISTS "Users can delete services for their stores" ON services;

-- service_options
DROP POLICY IF EXISTS "Public can view options" ON service_options;
DROP POLICY IF EXISTS "Merchants can manage options" ON service_options;
DROP POLICY IF EXISTS "Public can view service options" ON service_options;
DROP POLICY IF EXISTS "Users can insert service options for their stores" ON service_options;
DROP POLICY IF EXISTS "Users can update service options for their stores" ON service_options;
DROP POLICY IF EXISTS "Users can delete service options for their stores" ON service_options;

-- customers
DROP POLICY IF EXISTS "Public can insert customers" ON customers;
DROP POLICY IF EXISTS "Users can view customers for their stores" ON customers;
DROP POLICY IF EXISTS "Users can update customers for their stores" ON customers;
DROP POLICY IF EXISTS "Users can delete customers for their stores" ON customers;

-- bookings
DROP POLICY IF EXISTS "Public can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Public can view basic booking info for availability" ON bookings;
DROP POLICY IF EXISTS "Users can view bookings in their stores" ON bookings;
DROP POLICY IF EXISTS "Users can insert bookings in their stores" ON bookings;
DROP POLICY IF EXISTS "Users can update bookings in their stores" ON bookings;
DROP POLICY IF EXISTS "Users can delete bookings in their stores" ON bookings;

-- visit_records
DROP POLICY IF EXISTS "visit_records_select" ON visit_records;
DROP POLICY IF EXISTS "visit_records_insert" ON visit_records;
DROP POLICY IF EXISTS "visit_records_update" ON visit_records;
DROP POLICY IF EXISTS "visit_records_delete" ON visit_records;

-- coupons
DROP POLICY IF EXISTS "coupons_select" ON coupons;
DROP POLICY IF EXISTS "coupons_insert" ON coupons;
DROP POLICY IF EXISTS "coupons_update" ON coupons;
DROP POLICY IF EXISTS "coupons_delete" ON coupons;

-- ticket_masters
DROP POLICY IF EXISTS "ticket_masters_select" ON ticket_masters;
DROP POLICY IF EXISTS "ticket_masters_insert" ON ticket_masters;
DROP POLICY IF EXISTS "ticket_masters_update" ON ticket_masters;
DROP POLICY IF EXISTS "ticket_masters_delete" ON ticket_masters;

-- customer_tickets
DROP POLICY IF EXISTS "customer_tickets_select" ON customer_tickets;
DROP POLICY IF EXISTS "customer_tickets_insert" ON customer_tickets;
DROP POLICY IF EXISTS "customer_tickets_update" ON customer_tickets;
DROP POLICY IF EXISTS "customer_tickets_delete" ON customer_tickets;

-- ============================================================================
-- PHASE 3: CREATE NEW POLICIES
-- ============================================================================
-- Helper pattern used throughout:
--   "is_org_member" = user belongs to the store's organization
--   "is_demo_org"   = store belongs to demo org (dev only, remove in prod)
-- ============================================================================

-- ============================================================================
-- 1. ORGANIZATIONS (private - org members only)
-- ============================================================================

DROP POLICY IF EXISTS "org_select" ON organizations;
DROP POLICY IF EXISTS "org_select" ON organizations;
CREATE POLICY "org_select" ON organizations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
    )
    OR id = '11111111-1111-1111-1111-111111111111'
);

DROP POLICY IF EXISTS "org_insert" ON organizations;
DROP POLICY IF EXISTS "org_insert" ON organizations;
CREATE POLICY "org_insert" ON organizations FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "org_update" ON organizations;
DROP POLICY IF EXISTS "org_update" ON organizations;
CREATE POLICY "org_update" ON organizations FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
);

DROP POLICY IF EXISTS "org_delete" ON organizations;
DROP POLICY IF EXISTS "org_delete" ON organizations;
CREATE POLICY "org_delete" ON organizations FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role = 'owner'
    )
);

-- ============================================================================
-- 2. ORGANIZATION_MEMBERS (private - own records only)
-- ============================================================================

DROP POLICY IF EXISTS "org_members_select" ON organization_members;
DROP POLICY IF EXISTS "org_members_select" ON organization_members;
CREATE POLICY "org_members_select" ON organization_members FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "org_members_insert" ON organization_members;
DROP POLICY IF EXISTS "org_members_insert" ON organization_members;
CREATE POLICY "org_members_insert" ON organization_members FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "org_members_delete" ON organization_members;
DROP POLICY IF EXISTS "org_members_delete" ON organization_members;
CREATE POLICY "org_members_delete" ON organization_members FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- 3. STORES (public read for published, private management)
-- ============================================================================

-- Public: can view published stores (for booking portal)
DROP POLICY IF EXISTS "stores_public_select" ON stores;
DROP POLICY IF EXISTS "stores_public_select" ON stores;
CREATE POLICY "stores_public_select" ON stores FOR SELECT
USING (is_published = true);

-- Org members: can view ALL their org's stores (including unpublished)
DROP POLICY IF EXISTS "stores_org_select" ON stores;
DROP POLICY IF EXISTS "stores_org_select" ON stores;
CREATE POLICY "stores_org_select" ON stores FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = stores.organization_id
        AND organization_members.user_id = auth.uid()
    )
    OR organization_id = '11111111-1111-1111-1111-111111111111'
);

-- Org members: can insert stores
DROP POLICY IF EXISTS "stores_org_insert" ON stores;
DROP POLICY IF EXISTS "stores_org_insert" ON stores;
CREATE POLICY "stores_org_insert" ON stores FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = stores.organization_id
        AND organization_members.user_id = auth.uid()
    )
    OR organization_id = '11111111-1111-1111-1111-111111111111'
);

-- Org members: can update stores
DROP POLICY IF EXISTS "stores_org_update" ON stores;
DROP POLICY IF EXISTS "stores_org_update" ON stores;
CREATE POLICY "stores_org_update" ON stores FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = stores.organization_id
        AND organization_members.user_id = auth.uid()
    )
    OR organization_id = '11111111-1111-1111-1111-111111111111'
);

-- Org members: can delete stores
DROP POLICY IF EXISTS "stores_org_delete" ON stores;
DROP POLICY IF EXISTS "stores_org_delete" ON stores;
CREATE POLICY "stores_org_delete" ON stores FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = stores.organization_id
        AND organization_members.user_id = auth.uid()
    )
    OR organization_id = '11111111-1111-1111-1111-111111111111'
);

-- ============================================================================
-- 4. STAFF (public read for published stores, private management)
-- ============================================================================

DROP POLICY IF EXISTS "staff_public_select" ON staff;
DROP POLICY IF EXISTS "staff_public_select" ON staff;
CREATE POLICY "staff_public_select" ON staff FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = staff.store_id
        AND stores.is_published = true
    )
);

DROP POLICY IF EXISTS "staff_org_select" ON staff;
DROP POLICY IF EXISTS "staff_org_select" ON staff;
CREATE POLICY "staff_org_select" ON staff FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = staff.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = staff.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "staff_org_insert" ON staff;
DROP POLICY IF EXISTS "staff_org_insert" ON staff;
CREATE POLICY "staff_org_insert" ON staff FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = staff.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = staff.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "staff_org_update" ON staff;
DROP POLICY IF EXISTS "staff_org_update" ON staff;
CREATE POLICY "staff_org_update" ON staff FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = staff.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = staff.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "staff_org_delete" ON staff;
DROP POLICY IF EXISTS "staff_org_delete" ON staff;
CREATE POLICY "staff_org_delete" ON staff FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = staff.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = staff.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- ============================================================================
-- 5. STAFF_SHIFTS (public read for published stores, private management)
-- ============================================================================

DROP POLICY IF EXISTS "shifts_public_select" ON staff_shifts;
DROP POLICY IF EXISTS "shifts_public_select" ON staff_shifts;
CREATE POLICY "shifts_public_select" ON staff_shifts FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        WHERE staff.id = staff_shifts.staff_id
        AND stores.is_published = true
    )
);

DROP POLICY IF EXISTS "shifts_org_select" ON staff_shifts;
DROP POLICY IF EXISTS "shifts_org_select" ON staff_shifts;
CREATE POLICY "shifts_org_select" ON staff_shifts FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE staff.id = staff_shifts.staff_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        WHERE staff.id = staff_shifts.staff_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "shifts_org_insert" ON staff_shifts;
DROP POLICY IF EXISTS "shifts_org_insert" ON staff_shifts;
CREATE POLICY "shifts_org_insert" ON staff_shifts FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE staff.id = staff_shifts.staff_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        WHERE staff.id = staff_shifts.staff_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "shifts_org_update" ON staff_shifts;
DROP POLICY IF EXISTS "shifts_org_update" ON staff_shifts;
CREATE POLICY "shifts_org_update" ON staff_shifts FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE staff.id = staff_shifts.staff_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        WHERE staff.id = staff_shifts.staff_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "shifts_org_delete" ON staff_shifts;
DROP POLICY IF EXISTS "shifts_org_delete" ON staff_shifts;
CREATE POLICY "shifts_org_delete" ON staff_shifts FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE staff.id = staff_shifts.staff_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        WHERE staff.id = staff_shifts.staff_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- ============================================================================
-- 6. STAFF_SHIFT_EXCEPTIONS (public read for published, private management)
-- ============================================================================

DROP POLICY IF EXISTS "shift_exc_public_select" ON staff_shift_exceptions;
DROP POLICY IF EXISTS "shift_exc_public_select" ON staff_shift_exceptions;
CREATE POLICY "shift_exc_public_select" ON staff_shift_exceptions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        WHERE staff.id = staff_shift_exceptions.staff_id
        AND stores.is_published = true
    )
);

DROP POLICY IF EXISTS "shift_exc_org_select" ON staff_shift_exceptions;
DROP POLICY IF EXISTS "shift_exc_org_select" ON staff_shift_exceptions;
CREATE POLICY "shift_exc_org_select" ON staff_shift_exceptions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE staff.id = staff_shift_exceptions.staff_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        WHERE staff.id = staff_shift_exceptions.staff_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "shift_exc_org_insert" ON staff_shift_exceptions;
DROP POLICY IF EXISTS "shift_exc_org_insert" ON staff_shift_exceptions;
CREATE POLICY "shift_exc_org_insert" ON staff_shift_exceptions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE staff.id = staff_shift_exceptions.staff_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        WHERE staff.id = staff_shift_exceptions.staff_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "shift_exc_org_update" ON staff_shift_exceptions;
DROP POLICY IF EXISTS "shift_exc_org_update" ON staff_shift_exceptions;
CREATE POLICY "shift_exc_org_update" ON staff_shift_exceptions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE staff.id = staff_shift_exceptions.staff_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        WHERE staff.id = staff_shift_exceptions.staff_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "shift_exc_org_delete" ON staff_shift_exceptions;
DROP POLICY IF EXISTS "shift_exc_org_delete" ON staff_shift_exceptions;
CREATE POLICY "shift_exc_org_delete" ON staff_shift_exceptions FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE staff.id = staff_shift_exceptions.staff_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM staff
        JOIN stores ON staff.store_id = stores.id
        WHERE staff.id = staff_shift_exceptions.staff_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- ============================================================================
-- 7. SERVICES (public read for published stores, private management)
-- ============================================================================

DROP POLICY IF EXISTS "services_public_select" ON services;
DROP POLICY IF EXISTS "services_public_select" ON services;
CREATE POLICY "services_public_select" ON services FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = services.store_id
        AND stores.is_published = true
    )
);

DROP POLICY IF EXISTS "services_org_select" ON services;
DROP POLICY IF EXISTS "services_org_select" ON services;
CREATE POLICY "services_org_select" ON services FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = services.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = services.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "services_org_insert" ON services;
DROP POLICY IF EXISTS "services_org_insert" ON services;
CREATE POLICY "services_org_insert" ON services FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = services.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = services.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "services_org_update" ON services;
DROP POLICY IF EXISTS "services_org_update" ON services;
CREATE POLICY "services_org_update" ON services FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = services.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = services.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "services_org_delete" ON services;
DROP POLICY IF EXISTS "services_org_delete" ON services;
CREATE POLICY "services_org_delete" ON services FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = services.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = services.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- ============================================================================
-- 8. SERVICE_OPTIONS (public read for published stores, private management)
-- ============================================================================

DROP POLICY IF EXISTS "svc_opts_public_select" ON service_options;
DROP POLICY IF EXISTS "svc_opts_public_select" ON service_options;
CREATE POLICY "svc_opts_public_select" ON service_options FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = service_options.store_id
        AND stores.is_published = true
    )
);

DROP POLICY IF EXISTS "svc_opts_org_select" ON service_options;
DROP POLICY IF EXISTS "svc_opts_org_select" ON service_options;
CREATE POLICY "svc_opts_org_select" ON service_options FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = service_options.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = service_options.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "svc_opts_org_insert" ON service_options;
DROP POLICY IF EXISTS "svc_opts_org_insert" ON service_options;
CREATE POLICY "svc_opts_org_insert" ON service_options FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = service_options.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = service_options.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "svc_opts_org_update" ON service_options;
DROP POLICY IF EXISTS "svc_opts_org_update" ON service_options;
CREATE POLICY "svc_opts_org_update" ON service_options FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = service_options.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = service_options.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "svc_opts_org_delete" ON service_options;
DROP POLICY IF EXISTS "svc_opts_org_delete" ON service_options;
CREATE POLICY "svc_opts_org_delete" ON service_options FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = service_options.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = service_options.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- ============================================================================
-- 9. CUSTOMERS (public insert for booking, private management)
-- ============================================================================

-- Public insert: needed when a guest makes a booking
DROP POLICY IF EXISTS "customers_public_insert" ON customers;
DROP POLICY IF EXISTS "customers_public_insert" ON customers;
CREATE POLICY "customers_public_insert" ON customers FOR INSERT
WITH CHECK (true);

-- Org members: can view customers
DROP POLICY IF EXISTS "customers_org_select" ON customers;
DROP POLICY IF EXISTS "customers_org_select" ON customers;
CREATE POLICY "customers_org_select" ON customers FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = customers.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = customers.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- Logged-in customers can view their own records (for mypage)
DROP POLICY IF EXISTS "customers_self_select" ON customers;
DROP POLICY IF EXISTS "customers_self_select" ON customers;
CREATE POLICY "customers_self_select" ON customers FOR SELECT
USING (auth_user_id = auth.uid());

-- Org members: can update customers
DROP POLICY IF EXISTS "customers_org_update" ON customers;
DROP POLICY IF EXISTS "customers_org_update" ON customers;
CREATE POLICY "customers_org_update" ON customers FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = customers.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = customers.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- Org members: can delete customers
DROP POLICY IF EXISTS "customers_org_delete" ON customers;
DROP POLICY IF EXISTS "customers_org_delete" ON customers;
CREATE POLICY "customers_org_delete" ON customers FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = customers.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = customers.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- ============================================================================
-- 10. BOOKINGS (public insert + read for availability, private management)
-- ============================================================================

-- Public insert: anyone can make a booking
DROP POLICY IF EXISTS "bookings_public_insert" ON bookings;
DROP POLICY IF EXISTS "bookings_public_insert" ON bookings;
CREATE POLICY "bookings_public_insert" ON bookings FOR INSERT
WITH CHECK (true);

-- Public select: needed for availability check (only published stores)
DROP POLICY IF EXISTS "bookings_public_select" ON bookings;
DROP POLICY IF EXISTS "bookings_public_select" ON bookings;
CREATE POLICY "bookings_public_select" ON bookings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = bookings.store_id
        AND stores.is_published = true
    )
);

-- Org members: can view all bookings in their stores
DROP POLICY IF EXISTS "bookings_org_select" ON bookings;
DROP POLICY IF EXISTS "bookings_org_select" ON bookings;
CREATE POLICY "bookings_org_select" ON bookings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = bookings.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = bookings.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- Logged-in customers: can view their own bookings (for mypage)
DROP POLICY IF EXISTS "bookings_customer_select" ON bookings;
DROP POLICY IF EXISTS "bookings_customer_select" ON bookings;
CREATE POLICY "bookings_customer_select" ON bookings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM customers
        WHERE customers.id = bookings.customer_id
        AND customers.auth_user_id = auth.uid()
    )
);

-- Org members: can update bookings
DROP POLICY IF EXISTS "bookings_org_update" ON bookings;
DROP POLICY IF EXISTS "bookings_org_update" ON bookings;
CREATE POLICY "bookings_org_update" ON bookings FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = bookings.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = bookings.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- Logged-in customers: can update own bookings (for cancel)
DROP POLICY IF EXISTS "bookings_customer_update" ON bookings;
DROP POLICY IF EXISTS "bookings_customer_update" ON bookings;
CREATE POLICY "bookings_customer_update" ON bookings FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM customers
        WHERE customers.id = bookings.customer_id
        AND customers.auth_user_id = auth.uid()
    )
);

-- Org members: can delete bookings
DROP POLICY IF EXISTS "bookings_org_delete" ON bookings;
DROP POLICY IF EXISTS "bookings_org_delete" ON bookings;
CREATE POLICY "bookings_org_delete" ON bookings FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = bookings.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = bookings.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- ============================================================================
-- 11. VISIT_RECORDS (private - org members only)
-- ============================================================================

DROP POLICY IF EXISTS "visits_org_select" ON visit_records;
DROP POLICY IF EXISTS "visits_org_select" ON visit_records;
CREATE POLICY "visits_org_select" ON visit_records FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = visit_records.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = visit_records.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "visits_org_insert" ON visit_records;
DROP POLICY IF EXISTS "visits_org_insert" ON visit_records;
CREATE POLICY "visits_org_insert" ON visit_records FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = visit_records.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = visit_records.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "visits_org_update" ON visit_records;
DROP POLICY IF EXISTS "visits_org_update" ON visit_records;
CREATE POLICY "visits_org_update" ON visit_records FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = visit_records.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = visit_records.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "visits_org_delete" ON visit_records;
DROP POLICY IF EXISTS "visits_org_delete" ON visit_records;
CREATE POLICY "visits_org_delete" ON visit_records FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = visit_records.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = visit_records.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- ============================================================================
-- 12. COUPONS (public read for published stores, private management)
-- ============================================================================

DROP POLICY IF EXISTS "coupons_public_select" ON coupons;
DROP POLICY IF EXISTS "coupons_public_select" ON coupons;
CREATE POLICY "coupons_public_select" ON coupons FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = coupons.store_id
        AND stores.is_published = true
    )
);

DROP POLICY IF EXISTS "coupons_org_select" ON coupons;
DROP POLICY IF EXISTS "coupons_org_select" ON coupons;
CREATE POLICY "coupons_org_select" ON coupons FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = coupons.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = coupons.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "coupons_org_insert" ON coupons;
DROP POLICY IF EXISTS "coupons_org_insert" ON coupons;
CREATE POLICY "coupons_org_insert" ON coupons FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = coupons.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = coupons.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "coupons_org_update" ON coupons;
DROP POLICY IF EXISTS "coupons_org_update" ON coupons;
CREATE POLICY "coupons_org_update" ON coupons FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = coupons.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = coupons.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "coupons_org_delete" ON coupons;
DROP POLICY IF EXISTS "coupons_org_delete" ON coupons;
CREATE POLICY "coupons_org_delete" ON coupons FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = coupons.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = coupons.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- ============================================================================
-- 13. TICKET_MASTERS (public read for published stores, private management)
-- ============================================================================

DROP POLICY IF EXISTS "ticket_masters_public_select" ON ticket_masters;
DROP POLICY IF EXISTS "ticket_masters_public_select" ON ticket_masters;
CREATE POLICY "ticket_masters_public_select" ON ticket_masters FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = ticket_masters.store_id
        AND stores.is_published = true
    )
);

DROP POLICY IF EXISTS "ticket_masters_org_select" ON ticket_masters;
DROP POLICY IF EXISTS "ticket_masters_org_select" ON ticket_masters;
CREATE POLICY "ticket_masters_org_select" ON ticket_masters FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = ticket_masters.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = ticket_masters.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "ticket_masters_org_insert" ON ticket_masters;
DROP POLICY IF EXISTS "ticket_masters_org_insert" ON ticket_masters;
CREATE POLICY "ticket_masters_org_insert" ON ticket_masters FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = ticket_masters.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = ticket_masters.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "ticket_masters_org_update" ON ticket_masters;
DROP POLICY IF EXISTS "ticket_masters_org_update" ON ticket_masters;
CREATE POLICY "ticket_masters_org_update" ON ticket_masters FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = ticket_masters.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = ticket_masters.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "ticket_masters_org_delete" ON ticket_masters;
DROP POLICY IF EXISTS "ticket_masters_org_delete" ON ticket_masters;
CREATE POLICY "ticket_masters_org_delete" ON ticket_masters FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM stores
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE stores.id = ticket_masters.store_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = ticket_masters.store_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- ============================================================================
-- 14. CUSTOMER_TICKETS (private - org members only)
-- ============================================================================

DROP POLICY IF EXISTS "cust_tickets_org_select" ON customer_tickets;
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
    OR EXISTS (
        SELECT 1 FROM customers
        JOIN stores ON customers.store_id = stores.id
        WHERE customers.id = customer_tickets.customer_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- Logged-in customers can see their own tickets
DROP POLICY IF EXISTS "cust_tickets_self_select" ON customer_tickets;
DROP POLICY IF EXISTS "cust_tickets_self_select" ON customer_tickets;
CREATE POLICY "cust_tickets_self_select" ON customer_tickets FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM customers
        WHERE customers.id = customer_tickets.customer_id
        AND customers.auth_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "cust_tickets_org_insert" ON customer_tickets;
DROP POLICY IF EXISTS "cust_tickets_org_insert" ON customer_tickets;
CREATE POLICY "cust_tickets_org_insert" ON customer_tickets FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM customers
        JOIN stores ON customers.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE customers.id = customer_tickets.customer_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM customers
        JOIN stores ON customers.store_id = stores.id
        WHERE customers.id = customer_tickets.customer_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "cust_tickets_org_update" ON customer_tickets;
DROP POLICY IF EXISTS "cust_tickets_org_update" ON customer_tickets;
CREATE POLICY "cust_tickets_org_update" ON customer_tickets FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM customers
        JOIN stores ON customers.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE customers.id = customer_tickets.customer_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM customers
        JOIN stores ON customers.store_id = stores.id
        WHERE customers.id = customer_tickets.customer_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

DROP POLICY IF EXISTS "cust_tickets_org_delete" ON customer_tickets;
DROP POLICY IF EXISTS "cust_tickets_org_delete" ON customer_tickets;
CREATE POLICY "cust_tickets_org_delete" ON customer_tickets FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM customers
        JOIN stores ON customers.store_id = stores.id
        JOIN organization_members ON stores.organization_id = organization_members.organization_id
        WHERE customers.id = customer_tickets.customer_id
        AND organization_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM customers
        JOIN stores ON customers.store_id = stores.id
        WHERE customers.id = customer_tickets.customer_id
        AND stores.organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- ============================================================================
-- ============================================================================
-- DONE! All 14 tables now have proper RLS policies.
-- ============================================================================

-- Summary of access patterns:
-- PUBLIC READ:    stores, staff, staff_shifts, shift_exceptions, services,
--                 service_options, bookings, coupons, ticket_masters (published stores only)
-- PUBLIC INSERT:  customers, bookings (for guest booking flow)
-- PRIVATE ONLY:   organizations, organization_members,
--                 visit_records, customer_tickets
-- DELETE:         NEVER public - always requires org membership
