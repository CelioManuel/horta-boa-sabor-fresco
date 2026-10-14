CREATE POLICY roles_admin_insert ON public.user_roles FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY roles_admin_delete ON public.user_roles FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
GRANT INSERT, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;