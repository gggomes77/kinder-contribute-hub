-- Create families table for simple username-based authentication
CREATE TABLE public.families (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading family data (for login validation)
CREATE POLICY "Anyone can read families for login" 
ON public.families 
FOR SELECT 
USING (true);

-- Create time_contributions table
CREATE TABLE public.time_contributions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    hours DECIMAL(4,2) NOT NULL CHECK (hours > 0),
    activity TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.time_contributions ENABLE ROW LEVEL SECURITY;

-- Create policies for time contributions (families can only see their own data)
CREATE POLICY "Families can view their own contributions" 
ON public.time_contributions 
FOR SELECT 
USING (family_id IN (SELECT id FROM public.families WHERE username = current_setting('app.current_family', true)));

CREATE POLICY "Families can create their own contributions" 
ON public.time_contributions 
FOR INSERT 
WITH CHECK (family_id IN (SELECT id FROM public.families WHERE username = current_setting('app.current_family', true)));

-- Create cleaning_slots table
CREATE TABLE public.cleaning_slots (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    area TEXT NOT NULL,
    max_slots INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cleaning_slots ENABLE ROW LEVEL SECURITY;

-- Create cleaning_assignments table (many-to-many between families and cleaning slots)
CREATE TABLE public.cleaning_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    cleaning_slot_id UUID NOT NULL REFERENCES public.cleaning_slots(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(family_id, cleaning_slot_id)
);

-- Enable Row Level Security
ALTER TABLE public.cleaning_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for cleaning slots (everyone can see all slots)
CREATE POLICY "Everyone can view cleaning slots" 
ON public.cleaning_slots 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create cleaning slots" 
ON public.cleaning_slots 
FOR INSERT 
WITH CHECK (true);

-- Policies for cleaning assignments
CREATE POLICY "Everyone can view assignments" 
ON public.cleaning_assignments 
FOR SELECT 
USING (true);

CREATE POLICY "Families can create assignments" 
ON public.cleaning_assignments 
FOR INSERT 
WITH CHECK (family_id IN (SELECT id FROM public.families WHERE username = current_setting('app.current_family', true)));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_families_updated_at
    BEFORE UPDATE ON public.families
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_contributions_updated_at
    BEFORE UPDATE ON public.time_contributions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cleaning_slots_updated_at
    BEFORE UPDATE ON public.cleaning_slots
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample families with Italian names
INSERT INTO public.families (username, display_name) VALUES 
    ('rossi', 'Famiglia Rossi'),
    ('bianchi', 'Famiglia Bianchi'),
    ('verdi', 'Famiglia Verdi'),
    ('ferrari', 'Famiglia Ferrari'),
    ('romano', 'Famiglia Romano');