-- Add missing RLS policies for better security

-- Add UPDATE policy for cleaning_assignments (families can update their own)
CREATE POLICY "Families can update their own assignments"
ON public.cleaning_assignments
FOR UPDATE
USING (family_id IN (
  SELECT id FROM families 
  WHERE username = current_setting('app.current_family', true)
));

-- Add DELETE policy for cleaning_assignments (families can delete their own)
CREATE POLICY "Families can delete their own assignments"
ON public.cleaning_assignments
FOR DELETE
USING (family_id IN (
  SELECT id FROM families 
  WHERE username = current_setting('app.current_family', true)
));

-- Add UPDATE policy for cleaning_slots (admins only)
CREATE POLICY "Admins can update cleaning slots"
ON public.cleaning_slots
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM families 
  WHERE username = current_setting('app.current_family', true) 
  AND is_admin = true
));

-- Add DELETE policy for cleaning_slots (admins only)
CREATE POLICY "Admins can delete cleaning slots"
ON public.cleaning_slots
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM families 
  WHERE username = current_setting('app.current_family', true) 
  AND is_admin = true
));

-- Add UPDATE policy for task_assignments (families can update their own)
CREATE POLICY "Families can update their own task assignments"
ON public.task_assignments
FOR UPDATE
USING (family_id IN (
  SELECT id FROM families 
  WHERE username = current_setting('app.current_family', true)
));

-- Add UPDATE policy for families (families can update their own profile, admins can update all)
CREATE POLICY "Families can update their own profile"
ON public.families
FOR UPDATE
USING (
  username = current_setting('app.current_family', true)
  OR EXISTS (
    SELECT 1 FROM families 
    WHERE username = current_setting('app.current_family', true) 
    AND is_admin = true
  )
);

-- Add DELETE policy for families (admins only)
CREATE POLICY "Admins can delete families"
ON public.families
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM families 
  WHERE username = current_setting('app.current_family', true) 
  AND is_admin = true
));

-- Add INSERT policy for families (admins only)
CREATE POLICY "Admins can create families"
ON public.families
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM families 
  WHERE username = current_setting('app.current_family', true) 
  AND is_admin = true
));

-- Add DELETE policy for time_contributions (families can delete their own)
CREATE POLICY "Families can delete their own contributions"
ON public.time_contributions
FOR DELETE
USING (family_id IN (
  SELECT id FROM families 
  WHERE username = current_setting('app.current_family', true)
));

-- Add UPDATE policy for time_contributions (families can update their own)
CREATE POLICY "Families can update their own contributions"
ON public.time_contributions
FOR UPDATE
USING (family_id IN (
  SELECT id FROM families 
  WHERE username = current_setting('app.current_family', true)
));