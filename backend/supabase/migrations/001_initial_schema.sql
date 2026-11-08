-- 1. Create the user_profiles table
create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  esim_iccid text,
  esim_qr_code text,
  vpn_public_key text,
  active_network text default 'Auto',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Enable Row Level Security (protects user data)
alter table public.user_profiles enable row level security;

-- 3. Remove old policies if re-running, then create clean permissions
drop policy if exists "Users can view own profile" on public.user_profiles;
drop policy if exists "Users can upsert own profile" on public.user_profiles;

create policy "Users can manage own profile"
  on public.user_profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);