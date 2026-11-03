ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_lat numeric, ADD COLUMN IF NOT EXISTS delivery_lng numeric;

CREATE OR REPLACE FUNCTION public.get_order_customers(order_ids uuid[])
RETURNS TABLE(order_id uuid, full_name text, phone text, email text, nuit text, account_phone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT o.id, p.full_name, p.phone, u.email::text, p.nuit, u.phone::text
  FROM public.orders o
  LEFT JOIN public.profiles p ON p.id = o.user_id
  LEFT JOIN auth.users u ON u.id = o.user_id
  WHERE o.id = ANY(order_ids)
    AND (private.has_role(auth.uid(), 'admin'::app_role)
         OR (o.operator_id = auth.uid() AND private.has_role(auth.uid(), 'operator'::app_role)));
$$;
REVOKE EXECUTE ON FUNCTION public.get_order_customers(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_order_customers(uuid[]) TO authenticated;