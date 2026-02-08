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