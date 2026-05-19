-- Module 7 : Salaires (mensuel / hebdomadaire)

create table if not exists public.employes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  nom text not null,
  poste text,
  created_at timestamptz not null default now()
);

create index if not exists employes_business_idx on public.employes(business_id);

create table if not exists public.salaires (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  employe_id uuid not null references public.employes(id) on delete restrict,
  montant numeric(10, 2) not null,
  periode_mois date,
  type_periode text not null default 'mensuel'
    check (type_periode in ('mensuel', 'hebdomadaire')),
  date_debut date not null,
  date_fin date not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists salaires_business_idx on public.salaires(business_id);
create index if not exists salaires_employe_idx on public.salaires(employe_id);

-- Colonnes si la table existait déjà sans type_periode / dates
alter table public.salaires
  add column if not exists type_periode text;

alter table public.salaires
  add column if not exists date_debut date;

alter table public.salaires
  add column if not exists date_fin date;

-- Contrainte type_periode (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'salaires_type_periode_check'
  ) then
    alter table public.salaires
      add constraint salaires_type_periode_check
      check (type_periode in ('mensuel', 'hebdomadaire'));
  end if;
end $$;

-- Rétrocompat : remplir depuis periode_mois si présent
update public.salaires s
set
  type_periode = coalesce(s.type_periode, 'mensuel'),
  date_debut = coalesce(
    s.date_debut,
    date_trunc('month', s.periode_mois)::date
  ),
  date_fin = coalesce(
    s.date_fin,
    (date_trunc('month', s.periode_mois) + interval '1 month - 1 day')::date
  )
where s.periode_mois is not null
  and (s.date_debut is null or s.date_fin is null or s.type_periode is null);

alter table public.employes enable row level security;
alter table public.salaires enable row level security;

drop policy if exists "employes_tenant_rw" on public.employes;
create policy "employes_tenant_rw" on public.employes
  for all using (
    business_id in (
      select business_id from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "salaires_tenant_rw" on public.salaires;
create policy "salaires_tenant_rw" on public.salaires
  for all using (
    business_id in (
      select business_id from public.profiles where id = auth.uid()
    )
  );
