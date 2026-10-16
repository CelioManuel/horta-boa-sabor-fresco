ALTER TABLE public.stores ALTER COLUMN delivery_fee SET DEFAULT 0;
ALTER TABLE public.orders ALTER COLUMN delivery_fee SET DEFAULT 0;
CREATE OR REPLACE FUNCTION public.enforce_free_delivery()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.delivery_fee := 0;
  IF TG_TABLE_NAME = 'orders' THEN
    NEW.total := NEW.subtotal - NEW.discount;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_free_delivery() FROM PUBLIC;
CREATE TRIGGER stores_free_delivery BEFORE INSERT OR UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.enforce_free_delivery();
CREATE TRIGGER orders_free_delivery BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.enforce_free_delivery();