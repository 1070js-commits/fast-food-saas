-- Module 6 : Tickets + suivi client + SMS

create extension if not exists "pgcrypto";

-- 0. Ajout (sécurisé) du numéro client sur la commande
alter table public.orders
  add column if not exists customer_phone text;

-- 1. Ticket par commande (numéro court + token public pour QR/URL)
create table if not exists public.order_tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  ticket_number text not null,                 -- ex : "A042" (visible)
  public_token text not null unique,           -- ex : "k3f9aZx7p2" (URL/QR)
  customer_phone text,                         -- E.164 si fourni
  sms_notified_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists order_tickets_token_idx
  on public.order_tickets(public_token);

-- 2. Génération auto d'un ticket à la création d'une commande
create or replace function public.generate_ticket_for_order()
returns trigger
language plpgsql
security definer
as $$
declare
  v_count int;
  v_number text;
  v_token text;
begin
  -- numéro = "A" + count quotidien zero-padded sur 3 chiffres
  select count(*) + 1
    into v_count
    from public.orders o
   where o.business_id = new.business_id
     and o.created_at::date = now()::date;

  v_number := 'A' || lpad(v_count::text, 3, '0');
  v_token  := encode(gen_random_bytes(8), 'hex');

  insert into public.order_tickets (order_id, ticket_number, public_token, customer_phone)
  values (new.id, v_number, v_token, new.customer_phone);

  return new;
end;
$$;

drop trigger if exists trg_generate_ticket on public.orders;
create trigger trg_generate_ticket
  after insert on public.orders
  for each row execute function public.generate_ticket_for_order();

-- 3. Vue publique pour la page de tracking (accès via token, sans auth)
create or replace view public.public_order_status as
  select t.public_token,
         t.ticket_number,
         o.id            as order_id,
         o.status,
         o.total,
         o.created_at,
         o.business_id,
         b.name          as business_name
    from public.order_tickets t
    join public.orders o on o.id = t.order_id
    join public.businesses b on b.id = o.business_id;

-- 4. RLS
alter table public.order_tickets enable row level security;

drop policy if exists "order_tickets_tenant_r" on public.order_tickets;
create policy "order_tickets_tenant_r" on public.order_tickets
  for select using (
    order_id in (
      select id from public.orders
       where business_id in (
         select business_id from public.profiles where id = auth.uid()
       )
    )
  );

-- La vue public_order_status est interrogée via le service-role côté API publique.
