-- Update the RLS policy to allow all families to view all contributions
DROP POLICY IF EXISTS "Families can view their own contributions" ON public.time_contributions;

CREATE POLICY "Everyone can view all contributions" 
ON public.time_contributions 
FOR SELECT 
USING (true);