CREATE OR REPLACE FUNCTION public.admin_save_profile_roles(target_id uuid, target_name text, target_phone text, target_nuit text, target_roles public.app_role[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Administrator required'; END IF;
  IF cardinality(target_roles) IS NULL OR cardinality(target_roles) < 1 THEN RAISE EXCEPTION 'At least one role required'; END IF;
  IF target_id = auth.uid() AND NOT ('admin'::public.app_role = ANY(target_roles)) THEN RAISE EXCEPTION 'Cannot remove own administrator role'; END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_id) THEN RAISE EXCEPTION 'User not found'; END IF;
  INSERT INTO public.profiles(id, full_name, phone, nuit) VALUES(target_id, trim(target_name), trim(target_phone), nullif(trim(target_nuit), '')) ON CONFLICT(id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, nuit = EXCLUDED.nuit;
  DELETE FROM public.user_roles WHERE user_id = target_id AND NOT (role = ANY(target_roles));
  INSERT INTO public.user_roles(user_id, role) SELECT target_id, r FROM unnest(target_roles) r ON CONFLICT(user_id, role) DO NOTHING;
END; $$;
REVOKE ALL ON FUNCTION public.admin_save_profile_roles(uuid,text,text,text,public.app_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_profile_roles(uuid,text,text,text,public.app_role[]) TO authenticated;