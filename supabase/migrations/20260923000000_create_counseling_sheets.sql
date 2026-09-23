-- Patient intake and staff findings are separate so patients cannot read or
-- overwrite clinical notes. Apply this migration before enabling the UI.
CREATE TABLE IF NOT EXISTS public.counseling_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    consultation_date DATE NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(answers) = 'object' AND octet_length(answers::text) <= 100000),
    marks JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(marks) = 'array' AND jsonb_array_length(marks) <= 100),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS counseling_sheets_customer_date_idx
    ON public.counseling_sheets (customer_id, consultation_date DESC, created_at DESC);

ALTER TABLE public.counseling_sheets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.counseling_sheets FROM anon, authenticated;
GRANT SELECT ON public.counseling_sheets TO authenticated;
GRANT INSERT (store_id, customer_id, consultation_date, answers, marks, created_by)
    ON public.counseling_sheets TO authenticated;

-- A patient can view only their own submissions.
CREATE POLICY counseling_sheets_patient_select ON public.counseling_sheets
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.customers c
            WHERE c.id = counseling_sheets.customer_id
              AND c.store_id = counseling_sheets.store_id
              AND c.auth_user_id = auth.uid()
        )
    );

-- A patient can submit for their own customer record, but cannot edit a
-- submitted sheet. Corrections are submitted as a new sheet.
CREATE POLICY counseling_sheets_patient_insert ON public.counseling_sheets
    FOR INSERT TO authenticated
    WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.customers c
            WHERE c.id = counseling_sheets.customer_id
              AND c.store_id = counseling_sheets.store_id
              AND c.auth_user_id = auth.uid()
        )
    );

CREATE POLICY counseling_sheets_staff_select ON public.counseling_sheets
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.customers c
            JOIN public.stores s ON s.id = c.store_id
            JOIN public.organization_members m ON m.organization_id = s.organization_id
            WHERE c.id = counseling_sheets.customer_id
              AND c.store_id = counseling_sheets.store_id
              AND m.user_id = auth.uid()
        )
    );

CREATE TABLE IF NOT EXISTS public.counseling_staff_notes (
    sheet_id UUID PRIMARY KEY REFERENCES public.counseling_sheets(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(answers) = 'object' AND octet_length(answers::text) <= 100000),
    marks JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(marks) = 'array' AND jsonb_array_length(marks) <= 100),
    updated_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.counseling_staff_notes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.counseling_staff_notes FROM anon, authenticated;
GRANT SELECT ON public.counseling_staff_notes TO authenticated;
GRANT INSERT (sheet_id, answers, marks, updated_by) ON public.counseling_staff_notes TO authenticated;
GRANT UPDATE (answers, marks, updated_by) ON public.counseling_staff_notes TO authenticated;

CREATE OR REPLACE FUNCTION public.set_counseling_staff_notes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_counseling_staff_notes_updated_at
    BEFORE UPDATE ON public.counseling_staff_notes
    FOR EACH ROW EXECUTE FUNCTION public.set_counseling_staff_notes_updated_at();

CREATE POLICY counseling_staff_notes_select ON public.counseling_staff_notes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.counseling_sheets sh
            JOIN public.customers c ON c.id = sh.customer_id AND c.store_id = sh.store_id
            JOIN public.stores s ON s.id = c.store_id
            JOIN public.organization_members m ON m.organization_id = s.organization_id
            WHERE sh.id = counseling_staff_notes.sheet_id
              AND m.user_id = auth.uid()
        )
    );

CREATE POLICY counseling_staff_notes_insert ON public.counseling_staff_notes
    FOR INSERT TO authenticated
    WITH CHECK (
        updated_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.counseling_sheets sh
            JOIN public.customers c ON c.id = sh.customer_id AND c.store_id = sh.store_id
            JOIN public.stores s ON s.id = c.store_id
            JOIN public.organization_members m ON m.organization_id = s.organization_id
            WHERE sh.id = counseling_staff_notes.sheet_id
              AND m.user_id = auth.uid()
        )
    );

CREATE POLICY counseling_staff_notes_update ON public.counseling_staff_notes
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.counseling_sheets sh
            JOIN public.customers c ON c.id = sh.customer_id AND c.store_id = sh.store_id
            JOIN public.stores s ON s.id = c.store_id
            JOIN public.organization_members m ON m.organization_id = s.organization_id
            WHERE sh.id = counseling_staff_notes.sheet_id
              AND m.user_id = auth.uid()
        )
    )
    WITH CHECK (
        updated_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.counseling_sheets sh
            JOIN public.customers c ON c.id = sh.customer_id AND c.store_id = sh.store_id
            JOIN public.stores s ON s.id = c.store_id
            JOIN public.organization_members m ON m.organization_id = s.organization_id
            WHERE sh.id = counseling_staff_notes.sheet_id
              AND m.user_id = auth.uid()
        )
    );
