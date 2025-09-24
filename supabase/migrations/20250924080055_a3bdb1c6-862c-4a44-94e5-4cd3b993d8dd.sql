-- Create tasks table for admin-posted tasks
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  max_assignees INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES families(id)
);

-- Create task assignments table
CREATE TABLE public.task_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, family_id)
);

-- Enable RLS on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on task_assignments table  
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for tasks
CREATE POLICY "Everyone can view tasks" 
ON public.tasks 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can create tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM families 
  WHERE families.username = current_setting('app.current_family', true) 
  AND families.is_admin = true
));

CREATE POLICY "Admins can update tasks" 
ON public.tasks 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM families 
  WHERE families.username = current_setting('app.current_family', true) 
  AND families.is_admin = true
));

CREATE POLICY "Admins can delete tasks" 
ON public.tasks 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM families 
  WHERE families.username = current_setting('app.current_family', true) 
  AND families.is_admin = true
));

-- RLS policies for task assignments
CREATE POLICY "Everyone can view task assignments" 
ON public.task_assignments 
FOR SELECT 
USING (true);

CREATE POLICY "Families can create their own task assignments" 
ON public.task_assignments 
FOR INSERT 
WITH CHECK (family_id IN (
  SELECT families.id FROM families 
  WHERE families.username = current_setting('app.current_family', true)
));

CREATE POLICY "Families can delete their own task assignments" 
ON public.task_assignments 
FOR DELETE 
USING (family_id IN (
  SELECT families.id FROM families 
  WHERE families.username = current_setting('app.current_family', true)
));

-- Add trigger for automatic timestamp updates on tasks
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();