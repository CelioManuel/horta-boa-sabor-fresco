<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting published git history.
<!-- LOVABLE:END -->

- Use TanStack file routes and keep the shared Horta Boa shopping shell in `HortaBoaApp`; this preserves one responsive commerce experience across customer and operational views.
- Store durable commerce and identity data in Lovable Cloud; local storage is limited to the temporary shopping basket.
- Extra pages render inside `HortaBoaApp view="page"` with components in `src/components/pages/`; shared helpers live in `src/components/ui-bits.tsx`.
- Order notifications are created by a database trigger on orders, so operators never write customer notifications directly.

- Calculate checkout amounts through `src/lib/checkout.ts` and enforce the delivery rule in database triggers; this keeps displayed and persisted totals aligned.
- Mobile registration uses Cloud Auth phone/password signup and SMS verification; configure the auth provider separately rather than implementing a parallel Twilio OTP store.
- Keep Bun tests in root `tests/` outside the browser TypeScript include; this prevents Bun global types from changing browser fetch definitions.
- Use a shared PasswordInput for all password entry, so visibility controls stay consistent.
- Home product links select a produce family in the full Products catalogue; family matching uses normalized leading names so package variants remain together.
- Account creation and account listing use authenticated administrator server functions; profile/role updates use a single administrator-checked database function to keep permissions atomic.
