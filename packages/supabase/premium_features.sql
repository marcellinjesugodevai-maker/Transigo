-- =============================================
-- TRANSIGO PREMIUM FEATURES SCHEMA
-- Clubs, Challenges, Predictions, Stats
-- =============================================

-- 1. CLUBS
create table if not exists public.clubs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  zone text not null,
  description text,
  avatar text, -- Emoji or URL
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. DRIVER CLUBS (Relation N-N)
create table if not exists public.driver_clubs (
  driver_id uuid references public.drivers(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete cascade,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (driver_id, club_id)
);

-- 3. DRIVER CHALLENGES
create table if not exists public.driver_challenges (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references public.drivers(id) on delete cascade,
  title text not null,
  description text,
  target integer not null DEFAULT 10,
  current integer not null DEFAULT 0,
  reward integer not null DEFAULT 500,
  type text not null CHECK (type IN ('rides', 'earnings', 'rating')),
  status text not null DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ZONE PREDICTIONS (IA)
create table if not exists public.zone_predictions (
  id uuid default gen_random_uuid() primary key,
  zone text not null,
  current_demand text not null check (current_demand in ('low', 'medium', 'high', 'surge')),
  predicted_demand text not null check (predicted_demand in ('low', 'medium', 'high', 'surge')),
  confidence integer default 80,
  trend text check (trend in ('up', 'down', 'stable')),
  surge_multiplier numeric(3, 1) default 1.0,
  reason text,
  recommendation text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. UPDATE DRIVERS TABLE (Stats)
alter table public.drivers add column if not exists xp integer default 0;
alter table public.drivers add column if not exists level integer default 1;
alter table public.drivers add column if not exists streak_days integer default 0;
alter table public.drivers add column if not exists glory_points integer default 0;

-- RLS POLICIES (Simplifiées pour dev)
alter table public.clubs enable row level security;
create policy "Public clubs read" on public.clubs for select using (true);

alter table public.driver_clubs enable row level security;
create policy "Drivers can view their clubs" on public.driver_clubs for select using (auth.uid() = driver_id);
create policy "Drivers can join clubs" on public.driver_clubs for insert with check (auth.uid() = driver_id);
create policy "Drivers can leave clubs" on public.driver_clubs for delete using (auth.uid() = driver_id);

alter table public.driver_challenges enable row level security;
create policy "Drivers can view their challenges" on public.driver_challenges for select using (auth.uid() = driver_id);

alter table public.zone_predictions enable row level security;
create policy "Public predictions read" on public.zone_predictions for select using (true);


-- SEED DATA (Données initiales pour tester)
insert into public.clubs (name, zone, description, avatar) values 
('Les Aigles de Cocody', 'Cocody', 'Le club des chauffeurs elite de Cocody.', '🦅'),
('Yopougon Express', 'Yopougon', 'Rapidité et efficacité à Yopougon.', '⚡'),
('Marcory V.I.P', 'Marcory', 'Service premium pour la zone 4.', '💎');

insert into public.zone_predictions (zone, current_demand, predicted_demand, confidence, trend, surge_multiplier, reason, recommendation) values
('Cocody Centre', 'high', 'surge', 85, 'up', 1.2, 'Sorties bureaux', 'Allez-y maintenant'),
('Plateau', 'medium', 'high', 70, 'up', 1.0, 'Conférence', 'Préparez-vous'),
('Aéroport FHB', 'low', 'surge', 90, 'up', 1.5, 'Vol AF703', 'Captez les arrivées');
