<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting published git history.
<!-- LOVABLE:END -->

- Use TanStack file routes and keep the shared Horta Boa shopping shell in `HortaBoaApp`; this preserves one responsive commerce experience across customer and operational views.
- Store durable commerce and identity data in Lovable Cloud; local storage is limited to the temporary shopping basket.
- Extra pages render inside `HortaBoaApp view="page"` with components in `src/components/pages/`; shared helpers live in `src/components/ui-bits.tsx`.
- Order notifications are created by a database trigger on orders, so operators never write customer notifications directly.
