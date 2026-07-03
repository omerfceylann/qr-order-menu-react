# QR Menu Project

A mobile-friendly QR menu and ordering system for a single restaurant, built with React, TypeScript, Tailwind CSS and Supabase.

Customers scan a table QR code, browse the menu, add items to the cart and place an order. Restaurant staff can manage menu items, categories, tables, QR codes, orders, themes and reports from the admin dashboard.

## Features

- Mobile customer QR menu at `/menu/:tableCode`
- Category-based menu layout with smooth scrolling
- Product detail modal, cart, order note and order submission
- Customer-side TR/EN language switch and light/dark mode
- Admin login with Supabase Auth
- Live order tracking and order status updates
- Menu, category, product, table and QR code management
- Turkish/English product names and descriptions
- Product image URL, file upload and nutrition fields
- Restaurant logo, hero background, menu font and 10 ready-made theme palettes
- Supabase Storage support for product and branding images
- Reports for revenue, average basket, best/low sellers, busy hours and table order counts

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase CLI, Database, Auth, Realtime and Storage
- react-router-dom
- react-hook-form
- lucide-react
- qrcode

## Installation

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env.local
```

Start local Supabase services:

```bash
npx supabase start
```

Copy the `API URL` and `anon key` from the Supabase CLI output into `.env.local`:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PUBLIC_SITE_URL=http://localhost:5173
```

Apply migrations and seed data to the local database:

```bash
npx supabase db reset
```

Run the development server:

```bash
npm run dev
```

## Demo URLs

- Home page: `http://localhost:5173`
- Example table menu: `http://localhost:5173/menu/masa-1`
- Admin login: `http://localhost:5173/admin/login`

## Creating an Admin User

Local Supabase Studio usually runs at:

```text
http://127.0.0.1:54323
```

1. Open Supabase Studio and go to Authentication > Users.
2. Create a new user.
3. Enable `Auto Confirm User` while creating the user.
4. Log in from `/admin/login` with the email and password you created.

## Supabase Structure

This project uses Supabase CLI migrations.

- Migration files: `supabase/migrations/`
- Seed data: `supabase/seed.sql`
- Product and branding images use the public `menu-images` Storage bucket.
- Public users can read active restaurant settings, tables, categories and menu items.
- Public users can create orders.
- Admin operations are restricted to authenticated Supabase users.

To reset the local database and reload seed data:

```bash
npm run supabase:reset
```

## Before Publishing to GitHub

Never commit `.env.local` to GitHub. It is already ignored in `.gitignore`.

The following files and folders should not be committed:

- `node_modules/`
- `dist/`
- `.DS_Store`
- `*.tsbuildinfo`
- `supabase/.temp/`
- `supabase/.branches/`

## Production Notes

1. Create a Supabase Cloud project.
2. Apply the migration files to your remote Supabase project.
3. Run the seed data on the remote database if needed.
4. Set the following environment variables in your deployment platform:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PUBLIC_SITE_URL`
5. Add your production domain to the Supabase Auth redirect URL list.

## License

MIT
