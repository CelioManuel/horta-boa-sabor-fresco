CREATE TABLE public.shop_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  min_delivery_amount numeric NOT NULL DEFAULT 1000 CHECK (min_delivery_amount >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.shop_settings (id) VALUES (true);
GRANT SELECT ON public.shop_settings TO anon, authenticated;
GRANT UPDATE ON public.shop_settings TO authenticated;
GRANT ALL ON public.shop_settings TO service_role;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_read ON public.shop_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY settings_admin_update ON public.shop_settings FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.orders ADD COLUMN fulfillment text NOT NULL DEFAULT 'delivery' CHECK (fulfillment IN ('delivery','pickup'));
ALTER TABLE public.orders ADD COLUMN cancelled_by_customer boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.enforce_delivery_minimum()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m numeric;
BEGIN
  IF NEW.fulfillment = 'delivery' THEN
    SELECT min_delivery_amount INTO m FROM public.shop_settings WHERE id;
    IF NEW.subtotal < coalesce(m, 0) THEN
      RAISE EXCEPTION 'Entrega disponível a partir de % MZN; escolha levantar na loja.', m;
    END IF;
  ELSIF NEW.store_id IS NULL THEN
    RAISE EXCEPTION 'Escolha a loja de levantamento.';
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.enforce_delivery_minimum() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER orders_delivery_minimum BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.enforce_delivery_minimum();

CREATE OR REPLACE FUNCTION public.cancel_my_order(target_order uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s order_status;
BEGIN
  SELECT status INTO s FROM public.orders WHERE id = target_order AND user_id = auth.uid() FOR UPDATE;
  IF s IS NULL THEN RAISE EXCEPTION 'Encomenda não encontrada'; END IF;
  IF s NOT IN ('received','preparing') THEN RAISE EXCEPTION 'Esta encomenda já saiu para entrega e não pode ser cancelada.'; END IF;
  UPDATE public.orders SET status = 'cancelled', cancelled_by_customer = true, updated_at = now() WHERE id = target_order;
END; $$;
REVOKE EXECUTE ON FUNCTION public.cancel_my_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_my_order(uuid) TO authenticated;

ALTER TABLE public.promotions ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.promotions ALTER COLUMN code DROP NOT NULL;