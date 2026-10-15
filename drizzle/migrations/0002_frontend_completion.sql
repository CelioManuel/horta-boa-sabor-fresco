ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS delivery_fee numeric NOT NULL DEFAULT 150;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promotion_code text;

GRANT SELECT ON public.products, public.stores, public.promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products, public.stores, public.promotions, public.user_addresses, public.notifications, public.operator_stock, public.orders, public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.products, public.stores, public.promotions, public.user_addresses, public.notifications, public.operator_stock, public.orders, public.order_items, public.profiles, public.user_roles TO service_role;

CREATE POLICY promotions_admin_read ON public.promotions FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION private.notify_order_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE labels jsonb := '{"received":"Recebida","preparing":"Em preparação","on_the_way":"A caminho","almost_there":"Quase a chegar","delivered":"Entregue","cancelled":"Cancelada"}';
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id, title, message, order_id) VALUES (NEW.user_id, 'Encomenda recebida', 'A sua encomenda #' || NEW.order_number || ' foi recebida.', NEW.id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications(user_id, title, message, order_id) VALUES (NEW.user_id, 'Encomenda ' || (labels->>NEW.status::text), 'A encomenda #' || NEW.order_number || ' está agora: ' || (labels->>NEW.status::text) || '.', NEW.id);
  ELSIF NEW.payment_status IS DISTINCT FROM OLD.payment_status AND NEW.payment_status = 'paid' THEN
    INSERT INTO public.notifications(user_id, title, message, order_id) VALUES (NEW.user_id, 'Pagamento confirmado', 'O pagamento da encomenda #' || NEW.order_number || ' foi confirmado.', NEW.id);
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.notify_order_change() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER orders_notify AFTER INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION private.notify_order_change();