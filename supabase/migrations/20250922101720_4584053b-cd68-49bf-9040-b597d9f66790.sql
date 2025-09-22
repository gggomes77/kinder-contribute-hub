-- Add admin role to families table
ALTER TABLE public.families ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL;

-- Create RLS policy to allow admins to delete time contributions
CREATE POLICY "Admins can delete any contribution" 
ON public.time_contributions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.families 
    WHERE families.username = current_setting('app.current_family'::text, true) 
    AND families.is_admin = true
  )
);

-- Create RLS policy to allow admins to update any contribution
CREATE POLICY "Admins can update any contribution" 
ON public.time_contributions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.families 
    WHERE families.username = current_setting('app.current_family'::text, true) 
    AND families.is_admin = true
  )
);

-- Make at least one family an admin (you can change this later)
UPDATE public.families SET is_admin = true WHERE id = (SELECT id FROM public.families LIMIT 1);