CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
ALTER POLICY "profiles_own_read" ON public.profiles USING (id = auth.uid() OR private.has_role(auth.uid(), 'admin'));
ALTER POLICY "profiles_own_update" ON public.profiles USING (id = auth.uid() OR private.has_role(auth.uid(), 'admin')) WITH CHECK (id = auth.uid() OR private.has_role(auth.uid(), 'admin'));
ALTER POLICY "roles_own_read" ON public.user_roles USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));
ALTER POLICY "products_public_read" ON public.products USING (is_active OR private.has_role(auth.uid(), 'admin'));
ALTER POLICY "products_admin_manage" ON public.products USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "stores_public_read" ON public.stores USING (is_active OR private.has_role(auth.uid(), 'admin'));
ALTER POLICY "stores_admin_manage" ON public.stores USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "orders_operator_read" ON public.orders USING (operator_id = auth.uid() AND private.has_role(auth.uid(), 'operator'));
ALTER POLICY "orders_operator_update" ON public.orders USING (operator_id = auth.uid() AND private.has_role(auth.uid(), 'operator')) WITH CHECK (operator_id = auth.uid() AND private.has_role(auth.uid(), 'operator'));
ALTER POLICY "orders_admin_manage" ON public.orders USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "order_items_visible" ON public.order_items USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR o.operator_id = auth.uid() OR private.has_role(auth.uid(), 'admin'))));
ALTER POLICY "promotions_admin_manage" ON public.promotions USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "operator_stock_own" ON public.operator_stock USING (operator_id = auth.uid() OR private.has_role(auth.uid(), 'admin')) WITH CHECK (operator_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));
DROP FUNCTION public.has_role(uuid, public.app_role);