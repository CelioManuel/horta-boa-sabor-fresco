# Horta Boa roadmap

- [x] Remove baskets from produce size photos and restore original golden onion colours across catalogue and variants; browser verified

- [x] Match red potato shape/colour to uploaded reference and apply size photos to Products and product detail; verified catalogue, detail and family photos in browser

- [x] Restrict operator-only accounts to their panel, including direct navigation and login
- [x] Group family variants by small, medium and large sizes and vary category photos (batata branca/vermelha and cebola)
- [x] Test real variant selection, basket read-back, image loading and controlled operator-role redirects through the UI; 19 tests passed
- [ ] Validate with a real operator session (no active operator auth account exists in the available test backend)

- [x] Restore the original home product selection and show family variants in a product-detail-style page; verify navigation and basket.

- [x] Keep home appearance and add a complete visible product catalogue with produce variants
- [x] Allow password visibility everywhere and remove promotional checkout codes
- [x] Add secure administrator account creation, profile editing and role management
- [x] Verify catalogue, passwords, account creation and profile/role updates through the UI (confirmation email delivery failed; pending account remains intact)
- [ ] Apply updated app, server-only environment settings and admin profile migration to the user's own server (requires access to that server)

- [x] Recreate the SAM customer shopping flow for horticultural products
- [x] Add Horta Boa branding, produce imagery and responsive navigation
- [x] Add independent Cloud data, roles and access rules
- [x] Add customer account, cart, checkout and order history
- [x] Add operator and administration views
- [x] Verify the live preview on desktop and mobile
- [x] Import the client's 146-item catalogue (hidden by default) with photos
- [x] Complete customer, operator, admin and support pages
- [x] Make all new deliveries free and verify totals
- [x] Add mobile registration, SMS confirmation and password login (UI and validation tested; real SMS blocked below)
- [x] Prepare a Docker server installation package and database migration instructions (installation and restore require the destination server)
- [ ] Activate and verify SMS delivery (requires Turbohost SMS settings)
- [ ] Connect hortaboa.co.mz (requires hosting destination and DNS setup)

- [ ] Email e SMS via Turbohost no servidor próprio (aguarda dados SMTP e user_token SMS da Turbohost)
