-- Fix the security warning by setting search_path for the set_config function
CREATE OR REPLACE FUNCTION public.set_config(setting_name text, setting_value text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  PERFORM set_config(setting_name, setting_value, false);
END;
$function$;