CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission text NOT NULL CHECK (permission IN ('orders','products','users','reports')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission)
);
GRANT SELECT ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.has_permission(_user_id uuid, _perm text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT private.has_role(_user_id, 'admin'::public.app_role)
      OR EXISTS (SELECT 1 FROM public.user_permissions WHERE user_id = _user_id AND permission = _perm)
$$;
GRANT EXECUTE ON FUNCTION private.has_permission(uuid, text) TO authenticated;

CREATE POLICY permissions_read ON public.user_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_permission(auth.uid(), 'users'));

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  category text NOT NULL,
  action text NOT NULL,
  entity_id text,
  summary text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_idx ON public.audit_logs (created_at DESC);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_read ON public.audit_logs FOR SELECT TO authenticated USING (private.has_permission(auth.uid(), 'reports'));

CREATE OR REPLACE FUNCTION public.write_audit(_category text, _action text, _entity text, _summary text, _details jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.audit_logs(actor_id, category, action, entity_id, summary, details) VALUES (auth.uid(), _category, _action, _entity, _summary, coalesce(_details, '{}'::jsonb));
$$;
REVOKE EXECUTE ON FUNCTION public.write_audit(text,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.log_sign_in()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE who text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  SELECT coalesce(nullif(email,''), phone, id::text) INTO who FROM auth.users WHERE id = auth.uid();
  PERFORM public.write_audit('session', 'sign_in', auth.uid()::text, 'Entrada no sistema: ' || coalesce(who, ''), '{}'::jsonb);
END; $$;
REVOKE EXECUTE ON FUNCTION public.log_sign_in() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_sign_in() TO authenticated;

CREATE OR REPLACE FUNCTION public.audit_orders_trg()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit('orders','created',NEW.id::text,'Encomenda #' || NEW.order_number || ' criada (' || NEW.total || ' MZN)', jsonb_build_object('total', NEW.total));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN PERFORM public.write_audit('orders','status',NEW.id::text,'Encomenda #' || NEW.order_number || ': ' || OLD.status || ' → ' || NEW.status, '{}'::jsonb); END IF;
    IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN PERFORM public.write_audit('orders','payment',NEW.id::text,'Encomenda #' || NEW.order_number || ' pagamento: ' || NEW.payment_status, '{}'::jsonb); END IF;
    IF NEW.operator_id IS DISTINCT FROM OLD.operator_id THEN PERFORM public.write_audit('orders','operator',NEW.id::text,'Encomenda #' || NEW.order_number || ' operador alterado', jsonb_build_object('operator_id', NEW.operator_id)); END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.write_audit('orders','deleted',OLD.id::text,'Encomenda #' || OLD.order_number || ' eliminada (' || OLD.total || ' MZN)', to_jsonb(OLD));
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_audit_orders AFTER INSERT OR UPDATE OR DELETE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.audit_orders_trg();

CREATE OR REPLACE FUNCTION public.audit_catalog_trg()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE label text; cat text;
BEGIN
  cat := CASE TG_TABLE_NAME WHEN 'products' THEN 'Produto' WHEN 'promotions' THEN 'Promoção' ELSE 'Loja' END;
  label := coalesce(CASE WHEN TG_OP = 'DELETE' THEN OLD.name ELSE NEW.name END, '');
  IF TG_OP = 'INSERT' THEN PERFORM public.write_audit('products','created',NEW.id::text, cat || ' criado: ' || label, '{}'::jsonb);
  ELSIF TG_OP = 'UPDATE' THEN PERFORM public.write_audit('products','updated',NEW.id::text, cat || ' alterado: ' || label, jsonb_build_object('antes', to_jsonb(OLD), 'depois', to_jsonb(NEW)));
  ELSE PERFORM public.write_audit('products','deleted',OLD.id::text, cat || ' removido: ' || label, to_jsonb(OLD)); END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_audit_products AFTER INSERT OR UPDATE OR DELETE ON public.products FOR EACH ROW EXECUTE FUNCTION public.audit_catalog_trg();
CREATE TRIGGER trg_audit_promotions AFTER INSERT OR UPDATE OR DELETE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.audit_catalog_trg();
CREATE TRIGGER trg_audit_stores AFTER INSERT OR UPDATE OR DELETE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.audit_catalog_trg();

CREATE OR REPLACE FUNCTION public.audit_access_trg()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target uuid; val text; who text;
BEGIN
  IF TG_OP = 'DELETE' THEN target := OLD.user_id; ELSE target := NEW.user_id; END IF;
  IF TG_TABLE_NAME = 'user_roles' THEN val := CASE WHEN TG_OP = 'DELETE' THEN OLD.role::text ELSE NEW.role::text END;
  ELSE val := CASE WHEN TG_OP = 'DELETE' THEN OLD.permission ELSE NEW.permission END; END IF;
  SELECT coalesce(nullif(full_name,''), target::text) INTO who FROM public.profiles WHERE id = target;
  PERFORM public.write_audit('users', CASE WHEN TG_OP = 'DELETE' THEN 'revoked' ELSE 'granted' END, target::text,
    (CASE WHEN TG_OP = 'DELETE' THEN 'Removido ' ELSE 'Atribuído ' END) || (CASE WHEN TG_TABLE_NAME = 'user_roles' THEN 'perfil ' ELSE 'permissão ' END) || val || ' a ' || coalesce(who, target::text), '{}'::jsonb);
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_audit_roles AFTER INSERT OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_access_trg();
CREATE TRIGGER trg_audit_permissions AFTER INSERT OR DELETE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION public.audit_access_trg();

CREATE OR REPLACE FUNCTION public.audit_deletion_req_trg()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN PERFORM public.write_audit('users','deletion_requested',NEW.user_id::text,'Pedido de eliminação de conta', '{}'::jsonb);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN PERFORM public.write_audit('users','deletion_' || NEW.status, NEW.user_id::text,'Pedido de eliminação: ' || NEW.status, '{}'::jsonb); END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_audit_deletion_requests AFTER INSERT OR UPDATE ON public.account_deletion_requests FOR EACH ROW EXECUTE FUNCTION public.audit_deletion_req_trg();

REVOKE EXECUTE ON FUNCTION public.audit_orders_trg(), public.audit_catalog_trg(), public.audit_access_trg(), public.audit_deletion_req_trg() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_order(target_order uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Administrator required'; END IF;
  DELETE FROM public.notifications WHERE order_id = target_order;
  DELETE FROM public.order_items WHERE order_id = target_order;
  DELETE FROM public.orders WHERE id = target_order;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_delete_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_order(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_permissions(target_id uuid, perms text[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Administrator required'; END IF;
  DELETE FROM public.user_permissions WHERE user_id = target_id AND NOT (permission = ANY(coalesce(perms, '{}')));
  INSERT INTO public.user_permissions(user_id, permission) SELECT target_id, p FROM unnest(coalesce(perms, '{}')) p
    WHERE p IN ('orders','products','users','reports') ON CONFLICT (user_id, permission) DO NOTHING;
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_set_permissions(uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_permissions(uuid, text[]) TO authenticated;

CREATE POLICY orders_perm_manage ON public.orders FOR ALL TO authenticated USING (private.has_permission(auth.uid(), 'orders')) WITH CHECK (private.has_permission(auth.uid(), 'orders'));
CREATE POLICY order_items_perm_read ON public.order_items FOR SELECT TO authenticated USING (private.has_permission(auth.uid(), 'orders'));
CREATE POLICY products_perm_manage ON public.products FOR ALL TO authenticated USING (private.has_permission(auth.uid(), 'products')) WITH CHECK (private.has_permission(auth.uid(), 'products'));
CREATE POLICY promotions_perm_manage ON public.promotions FOR ALL TO authenticated USING (private.has_permission(auth.uid(), 'products')) WITH CHECK (private.has_permission(auth.uid(), 'products'));
CREATE POLICY stores_perm_manage ON public.stores FOR ALL TO authenticated USING (private.has_permission(auth.uid(), 'products')) WITH CHECK (private.has_permission(auth.uid(), 'products'));
CREATE POLICY profiles_perm_read ON public.profiles FOR SELECT TO authenticated USING (private.has_permission(auth.uid(), 'users') OR private.has_permission(auth.uid(), 'orders'));
CREATE POLICY roles_perm_read ON public.user_roles FOR SELECT TO authenticated USING (private.has_permission(auth.uid(), 'users') OR private.has_permission(auth.uid(), 'orders'));

CREATE OR REPLACE FUNCTION public.get_order_customers(order_ids uuid[])
RETURNS TABLE(order_id uuid, full_name text, phone text, email text, nuit text, account_phone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT o.id, p.full_name, p.phone, u.email::text, p.nuit, u.phone::text
  FROM public.orders o
  LEFT JOIN public.profiles p ON p.id = o.user_id
  LEFT JOIN auth.users u ON u.id = o.user_id
  WHERE o.id = ANY(order_ids)
    AND (private.has_permission(auth.uid(), 'orders')
         OR (o.operator_id = auth.uid() AND private.has_role(auth.uid(), 'operator'::app_role)));
$$;