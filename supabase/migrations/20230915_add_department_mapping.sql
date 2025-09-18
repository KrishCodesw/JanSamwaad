-- Create a mapping table between department and tags/categories
CREATE TABLE IF NOT EXISTS public.department_categories (
  id bigserial primary key,
  department_id bigint not null references public.departments(id) on delete cascade,
  category text not null,
  created_at timestamptz not null default now(),
  UNIQUE(department_id, category)
);

-- Add department_id to issues table for direct assignment
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS department_id bigint references public.departments(id) on delete set null;
CREATE INDEX IF NOT EXISTS issues_department_id_idx ON public.issues(department_id);

-- Function to automatically assign department based on issue tags
CREATE OR REPLACE FUNCTION public.assign_department_on_issue()
RETURNS trigger AS $$
DECLARE
  matched_dept_id bigint;
BEGIN
  -- Find first matching department based on tags
  SELECT dc.department_id INTO matched_dept_id
  FROM public.department_categories dc
  WHERE dc.category = ANY(NEW.tags)
  LIMIT 1;

  -- If a matching department was found, assign it
  IF matched_dept_id IS NOT NULL THEN
    NEW.department_id := matched_dept_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-assign department on issue insert
DO $$ BEGIN
  CREATE TRIGGER trg_assign_department_on_issue
  BEFORE INSERT ON public.issues
  FOR EACH ROW EXECUTE PROCEDURE public.assign_department_on_issue();
EXCEPTION WHEN duplicate_object THEN null; END $$;