-- 1. First, Insert Departments
INSERT INTO public.departments (name, description) VALUES
('Waste Management', 'Handles garbage collection, landfill management, and sanitation issues.'),
('Roads & Infrastructure', 'Responsible for pothole repairs, streetlights, and pavement maintenance.'),
('Water & Sewerage', 'Manages water supply leaks, drainage overflows, and water quality.'),
('Parks & Recreation', 'Handles maintenance of public parks, gardens, and fallen trees.');

-- 2. Map Categories using subqueries to find the correct IDs
INSERT INTO public.department_categories (department_id, category) VALUES
((SELECT id FROM public.departments WHERE name = 'Waste Management'), 'sanitation'),
((SELECT id FROM public.departments WHERE name = 'Waste Management'), 'garbage'),
((SELECT id FROM public.departments WHERE name = 'Roads & Infrastructure'), 'pothole'),
((SELECT id FROM public.departments WHERE name = 'Roads & Infrastructure'), 'streetlight'),
((SELECT id FROM public.departments WHERE name = 'Water & Sewerage'), 'water'),
((SELECT id FROM public.departments WHERE name = 'Water & Sewerage'), 'drainage'),
((SELECT id FROM public.departments WHERE name = 'Parks & Recreation'), 'park'),
((SELECT id FROM public.departments WHERE name = 'Parks & Recreation'), 'tree');



-- TRIGGER
CREATE OR REPLACE FUNCTION public.fn_auto_route_issue()
RETURNS TRIGGER AS $$
BEGIN
  -- Look for a department that matches the first tag in the array
  SELECT department_id INTO NEW.department_id
  FROM public.department_categories
  WHERE category = ANY(NEW.tags)
  LIMIT 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_auto_route_issue
BEFORE INSERT ON public.issues
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_route_issue();


-- 1. Create a clean, consolidated function
CREATE OR REPLACE FUNCTION public.fn_auto_route_issue()
RETURNS TRIGGER AS $$
DECLARE
  matched_dept_id bigint;
BEGIN
  -- Search for the first matching department based on tags
  SELECT dc.department_id INTO matched_dept_id
  FROM public.department_categories dc
  WHERE dc.category = ANY(NEW.tags)
  LIMIT 1;

  -- If a match is found, set the department
  IF matched_dept_id IS NOT NULL THEN
    NEW.department_id := matched_dept_id;
  END IF;

  -- Hierarchy Logic: If it is a 'pothole', also flag it as priority automatically
  IF 'pothole' = ANY(NEW.tags) THEN
    NEW.flagged := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS tr_route_issue ON public.issues;
DROP TRIGGER IF EXISTS tr_auto_assign_issue ON public.issues;

-- 3. Create the single 'Backbone' trigger
CREATE TRIGGER tr_issue_backbone
BEFORE INSERT ON public.issues
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_route_issue();