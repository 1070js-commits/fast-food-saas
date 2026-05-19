-- Module 4 : Stock + recettes + déduction automatique

-- 1. Ingrédients (matières premières)
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  unit text not null,                       -- 'g', 'ml', 'piece', 'cl'
  current_stock numeric(12, 3) not null default 0,
  min_stock numeric(12, 3) not null default 0,
  unit_cost numeric(10, 4) not null default 0,
  supplier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ingredients_business_idx on public.ingredients(business_id);

-- 2. Recettes (lien menu_item <-> ingrédient + quantité)
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  quantity numeric(12, 3) not null,
  created_at timestamptz not null default now(),
  unique (menu_item_id, ingredient_id)
);

create index if not exists recipes_item_idx on public.recipes(menu_item_id);
create index if not exists recipes_ingredient_idx on public.recipes(ingredient_id);

-- 3. Journal des mouvements de stock
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  delta numeric(12, 3) not null,            -- négatif pour vente, positif pour réception
  reason text not null,                     -- 'order', 'reception', 'adjustment', 'loss'
  order_id uuid references public.orders(id) on delete set null,
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_ingredient_idx on public.stock_movements(ingredient_id);
create index if not exists stock_movements_order_idx on public.stock_movements(order_id);

-- 4. Trigger : déduction automatique du stock à la création d'une order_item
create or replace function public.deduct_stock_on_order_item()
returns trigger
language plpgsql
security definer
as $$
declare
  rec record;
begin
  for rec in
    select r.ingredient_id, (r.quantity * new.quantity) as total
    from public.recipes r
    where r.menu_item_id = new.menu_item_id
  loop
    update public.ingredients
       set current_stock = current_stock - rec.total,
           updated_at = now()
     where id = rec.ingredient_id;

    insert into public.stock_movements (ingredient_id, delta, reason, order_id)
    values (rec.ingredient_id, -rec.total, 'order', new.order_id);
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_deduct_stock on public.order_items;
create trigger trg_deduct_stock
  after insert on public.order_items
  for each row execute function public.deduct_stock_on_order_item();

-- 5. RLS
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.stock_movements enable row level security;

drop policy if exists "ingredients_tenant_rw" on public.ingredients;
create policy "ingredients_tenant_rw" on public.ingredients
  for all using (
    business_id in (
      select business_id from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "recipes_tenant_rw" on public.recipes;
create policy "recipes_tenant_rw" on public.recipes
  for all using (
    menu_item_id in (
      select id from public.menu_items
       where business_id in (
         select business_id from public.profiles where id = auth.uid()
       )
    )
  );

drop policy if exists "stock_movements_tenant_r" on public.stock_movements;
create policy "stock_movements_tenant_r" on public.stock_movements
  for select using (
    ingredient_id in (
      select id from public.ingredients
       where business_id in (
         select business_id from public.profiles where id = auth.uid()
       )
    )
  );

-- 6. Vue pratique : ingrédients en alerte
create or replace view public.low_stock_alerts as
  select i.*,
         (i.current_stock <= i.min_stock) as is_low,
         (i.current_stock <= 0) as is_out
    from public.ingredients i
   where i.current_stock <= i.min_stock;
