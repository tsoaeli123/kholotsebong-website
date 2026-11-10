# Kholo Tsebong Consulting

Responsive React + Vite website with a protected Supabase-backed admin CMS.

## Local development

```sh
npm install
cp .env.example .env.local
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` to connect a Supabase project. The browser app only uses the public anon key; never put a service-role key in a `VITE_*` variable.

## Supabase setup

1. Open the Supabase SQL editor and run [`supabase/schema.sql`](./supabase/schema.sql). This creates the CMS tables, public/admin row-level security policies, initial services and programs, and the public `consulting-assets` image bucket.
2. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` locally and in the deployment environment, then restart/redeploy the Vite app.
3. Create or invite an administrator in Supabase Auth. Assign the user's **`app_metadata`** claim `role: "admin"` from a trusted Supabase admin interface or server-side Admin API. Never grant this role from browser code or expose the service-role key.
4. Sign in at `/admin` using the administrator's email and password.

The admin guard checks the signed-in user's `app_metadata.role` claim, and the database policies independently enforce the same role. Public visitors can read published website content and submit enquiries/newsletter subscriptions; they cannot read leads or change CMS content. Uploaded article images are public-read and admin-write.

## Available commands

- `npm run dev` — local development server
- `npm run build` — TypeScript checks and production build
- `npm run lint` — Oxlint
- `npm run preview` — serve the production build locally

The original static website and its source copy are retained in `_old_site/` for reference.
