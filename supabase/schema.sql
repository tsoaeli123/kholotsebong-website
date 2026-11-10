create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  description text not null,
  image_url text not null default '',
  icon text not null default 'BriefcaseBusiness',
  active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null,
  body text not null,
  image_url text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 150),
  email text not null check (char_length(email) between 3 and 254),
  service text not null,
  message text not null check (char_length(message) between 1 and 10000),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id text primary key check (id = 'primary'),
  hero_headline text not null,
  about_text text not null,
  footer_copy text not null,
  phone text not null,
  email text not null,
  address text not null
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 3 and 254),
  created_at timestamptz not null default now()
);

grant select on public.services, public.programs, public.articles, public.site_settings to anon, authenticated;
grant insert on public.enquiries, public.newsletter_subscribers to anon, authenticated;
grant all on public.services, public.programs, public.articles, public.enquiries, public.site_settings, public.newsletter_subscribers to authenticated;

alter table public.services enable row level security;
alter table public.programs enable row level security;
alter table public.articles enable row level security;
alter table public.enquiries enable row level security;
alter table public.site_settings enable row level security;
alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Public can read active services" on public.services;
create policy "Public can read active services"
  on public.services for select to anon, authenticated
  using (active = true);
drop policy if exists "Admins manage services" on public.services;
create policy "Admins manage services"
  on public.services for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public can read active programs" on public.programs;
create policy "Public can read active programs"
  on public.programs for select to anon, authenticated
  using (active = true);
drop policy if exists "Admins manage programs" on public.programs;
create policy "Admins manage programs"
  on public.programs for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public can read published articles" on public.articles;
create policy "Public can read published articles"
  on public.articles for select to anon, authenticated
  using (status = 'published');
drop policy if exists "Admins manage articles" on public.articles;
create policy "Admins manage articles"
  on public.articles for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public can submit enquiries" on public.enquiries;
create policy "Public can submit enquiries"
  on public.enquiries for insert to anon, authenticated
  with check (true);
drop policy if exists "Admins manage enquiries" on public.enquiries;
create policy "Admins manage enquiries"
  on public.enquiries for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
  on public.site_settings for select to anon, authenticated
  using (true);
drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings"
  on public.site_settings for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public can subscribe to newsletter" on public.newsletter_subscribers;
create policy "Public can subscribe to newsletter"
  on public.newsletter_subscribers for insert to anon, authenticated
  with check (true);
drop policy if exists "Admins read newsletter subscribers" on public.newsletter_subscribers;
create policy "Admins read newsletter subscribers"
  on public.newsletter_subscribers for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

insert into public.services (title, description, image_url, icon, active, sort_order)
values
  ('Corporate Training', 'Business development and professional learning programmes designed to help individuals and teams build useful capabilities.', 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=85', 'GraduationCap', true, 1),
  ('Human Resources', 'Human resources services and people-focused organisational support. Contact our team to discuss the scope of support available for your organisation.', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85', 'UsersRound', true, 2),
  ('ICT Services', 'Technology services and practical ICT support to help businesses and organisations work more effectively.', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85', 'Cpu', true, 3),
  ('Computer Sales', 'Retail sales of computers and related technology products. Ask us about available products and specifications.', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85', 'Laptop', true, 4)
on conflict do nothing;

insert into public.programs (code, title, description, active, sort_order)
values
  ('GYBI', 'Generate Your Business Idea', 'For people exploring business opportunities and shaping a viable idea.', true, 1),
  ('SYB', 'Start Your Business', 'For aspiring entrepreneurs preparing to turn a business idea into an operating venture.', true, 2),
  ('IYB', 'Improve Your Business', 'For existing business owners seeking to strengthen business practices and operations.', true, 3),
  ('EYB', 'Expand Your Business', 'For established businesses considering growth and expansion.', true, 4)
on conflict do nothing;

insert into public.site_settings (id, hero_headline, about_text, footer_copy, phone, email, address)
values (
  'primary',
  'Building stronger|businesses. Empowering people.',
  'Kholo Tsebong Consulting brings business development, human resources and technology services together in one place. Our focus is on practical solutions that help individuals, teams and organisations build capability.',
  'Corporate training, human resources, ICT services and computer sales for people and organisations in Lesotho.',
  '+266 6345 0591',
  'info@kholotsebong.co.ls',
  'Maseru, Lesotho'
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('consulting-assets', 'consulting-assets', true)
on conflict (id) do update set public = true;

grant usage on schema storage to anon, authenticated;
grant select on storage.objects to anon, authenticated;
grant insert, update, delete on storage.objects to authenticated;

drop policy if exists "Public can read consulting assets" on storage.objects;
create policy "Public can read consulting assets"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'consulting-assets');
drop policy if exists "Admins manage consulting assets" on storage.objects;
create policy "Admins manage consulting assets"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'consulting-assets'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    bucket_id = 'consulting-assets'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
