-- ==============================================================================
-- ERP Features Migration (Expenses, Payroll, CRM, Regions, SNS)
-- ==============================================================================

-- 1. Regions (エリア管理)
CREATE TABLE IF NOT EXISTS public.regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add region_id to stores if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='region_id') THEN
        ALTER TABLE public.stores ADD COLUMN region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Expenses (経費管理)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- e.g., 'supplies', 'rent', 'utilities', 'other'
    amount INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Staff Salary Settings (キャスト給与条件設定)
-- NOTE: back_margin_rate と nomination_fee_rate は staff テーブルにも同名カラムが存在します。
-- 現在のシステムでは staff テーブルの値を正として使用しています。
-- 給与計算モジュール完成時にこちらのテーブルに統合予定です。
CREATE TABLE IF NOT EXISTS public.staff_salary_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    hourly_wage INTEGER DEFAULT 0,
    back_margin_rate NUMERIC(5, 2) DEFAULT 0, -- Percentage (0-100) ※現在は staff.back_margin_rate を正として使用
    nomination_fee_rate NUMERIC(5, 2) DEFAULT 0, -- Percentage (0-100) or fixed amount depending on business logic
    guarantee_daily INTEGER DEFAULT 0, -- 日給保証額
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id)
);

-- 4. Daily Guarantees / Payouts (日次給与・精算データ)
CREATE TABLE IF NOT EXISTS public.daily_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    payout_date DATE NOT NULL DEFAULT CURRENT_DATE,
    base_amount INTEGER DEFAULT 0, -- 基本給/保証給
    back_amount INTEGER DEFAULT 0, -- 歩合給
    deduction_amount INTEGER DEFAULT 0, -- 控除額（源泉徴収、厚生費など）
    deduction_reason TEXT,
    total_amount INTEGER DEFAULT 0, -- 支給総額
    is_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id, payout_date)
);

-- 5. Customer Notes (顧客対応履歴・カルテ)
CREATE TABLE IF NOT EXISTS public.customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    note_content TEXT NOT NULL,
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Message/Script Templates (定型文・スクリプト管理)
CREATE TABLE IF NOT EXISTS public.message_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT, -- e.g., 'greeting', 'thanks', 'reminder'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tweet Templates / Schedules (SNS・自動ツイート管理)
CREATE TABLE IF NOT EXISTS public.tweet_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tweet_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_salary_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweet_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweet_schedules ENABLE ROW LEVEL SECURITY;

-- Helper function to check org membership via store_id
-- We already have standard access patterns, so we'll use a simplified service role bypass for admin actions
-- and standard user auth checking.

-- 1. Regions
CREATE POLICY "Enable read access for organization members" ON public.regions
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
    );
CREATE POLICY "Enable all access for org admins" ON public.regions
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- 2. Expenses
CREATE POLICY "Enable read access for authenticated users in org" ON public.expenses
    FOR SELECT USING (
        store_id IN (SELECT s.id FROM public.stores s JOIN public.organization_members om ON s.organization_id = om.organization_id WHERE om.user_id = auth.uid())
    );
CREATE POLICY "Enable all access for org members" ON public.expenses
    FOR ALL USING (
        store_id IN (SELECT s.id FROM public.stores s JOIN public.organization_members om ON s.organization_id = om.organization_id WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'manager'))
    );

-- 3. Staff Salary Settings
CREATE POLICY "Enable read access for authenticated users in org" ON public.staff_salary_settings
    FOR SELECT USING (
        staff_id IN (SELECT st.id FROM public.staff st JOIN public.stores s ON st.store_id = s.id JOIN public.organization_members om ON s.organization_id = om.organization_id WHERE om.user_id = auth.uid())
    );
CREATE POLICY "Enable all access for org members" ON public.staff_salary_settings
    FOR ALL USING (
        staff_id IN (SELECT st.id FROM public.staff st JOIN public.stores s ON st.store_id = s.id JOIN public.organization_members om ON s.organization_id = om.organization_id WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'manager'))
    );

-- 4. Daily Payouts
CREATE POLICY "Enable read access for authenticated users in org" ON public.daily_payouts
    FOR SELECT USING (
        store_id IN (SELECT s.id FROM public.stores s JOIN public.organization_members om ON s.organization_id = om.organization_id WHERE om.user_id = auth.uid())
    );
CREATE POLICY "Enable all access for org members" ON public.daily_payouts
    FOR ALL USING (
        store_id IN (SELECT s.id FROM public.stores s JOIN public.organization_members om ON s.organization_id = om.organization_id WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'manager'))
    );

-- 5. Customer Notes
CREATE POLICY "Enable read access for authenticated users in org" ON public.customer_notes
    FOR SELECT USING (
        store_id IN (SELECT s.id FROM public.stores s JOIN public.organization_members om ON s.organization_id = om.organization_id WHERE om.user_id = auth.uid())
    );
CREATE POLICY "Enable all access for org members" ON public.customer_notes
    FOR ALL USING (
        store_id IN (SELECT s.id FROM public.stores s JOIN public.organization_members om ON s.organization_id = om.organization_id WHERE om.user_id = auth.uid())
    );

-- 6. Message Scripts
CREATE POLICY "Enable read access for authenticated users in org" ON public.message_scripts
    FOR SELECT USING (
        store_id IN (SELECT s.id FROM public.stores s JOIN public.organization_members om ON s.organization_id = om.organization_id WHERE om.user_id = auth.uid())
    );
CREATE POLICY "Enable all access for org members" ON public.message_scripts
    FOR ALL USING (
        store_id IN (SELECT s.id FROM public.stores s JOIN public.organization_members om ON s.organization_id = om.organization_id WHERE om.user_id = auth.uid())
    );

-- 7. Tweet Templates & Schedules
CREATE POLICY "Enable read access for authenticated users in org" ON public.tweet_templates
    FOR SELECT USING (
        store_id IN (SELECT s.id FROM public.stores s JOIN public.organization_members om ON s.organization_id = om.organization_id WHERE om.user_id = auth.uid())
    );
CREATE POLICY "Enable all access for org members" ON public.tweet_templates
    FOR ALL USING (
        store_id IN (SELECT s.id FROM public.stores s JOIN public.organization_members om ON s.organization_id = om.organization_id WHERE om.user_id = auth.uid())
    );

CREATE POLICY "Enable read access for authenticated users in org" ON public.tweet_schedules
    FOR SELECT USING (
        store_id IN (SELECT s.id FROM public.stores s JOIN public.organization_members om ON s.organization_id = om.organization_id WHERE om.user_id = auth.uid())
    );
CREATE POLICY "Enable all access for org members" ON public.tweet_schedules
    FOR ALL USING (
        store_id IN (SELECT s.id FROM public.stores s JOIN public.organization_members om ON s.organization_id = om.organization_id WHERE om.user_id = auth.uid())
    );
 
 - -   A d d   B l u e s k y   i n t e g r a t i o n   c o l u m n s   t o   t h e   s t o r e s   t a b l e  
 D O   $ $  
 B E G I N  
         I F   N O T   E X I S T S   ( S E L E C T   1   F R O M   i n f o r m a t i o n _ s c h e m a . c o l u m n s   W H E R E   t a b l e _ n a m e = ' s t o r e s '   A N D   c o l u m n _ n a m e = ' b l u e s k y _ h a n d l e ' )   T H E N  
                 A L T E R   T A B L E   p u b l i c . s t o r e s   A D D   C O L U M N   b l u e s k y _ h a n d l e   T E X T ;  
         E N D   I F ;  
          
         I F   N O T   E X I S T S   ( S E L E C T   1   F R O M   i n f o r m a t i o n _ s c h e m a . c o l u m n s   W H E R E   t a b l e _ n a m e = ' s t o r e s '   A N D   c o l u m n _ n a m e = ' b l u e s k y _ a p p _ p a s s w o r d ' )   T H E N  
                 A L T E R   T A B L E   p u b l i c . s t o r e s   A D D   C O L U M N   b l u e s k y _ a p p _ p a s s w o r d   T E X T ;  
         E N D   I F ;  
 E N D   $ $ ;  
 