-- Code PIN gérant (4 chiffres) par commerce
alter table public.businesses
  add column if not exists manager_pin varchar(4);

comment on column public.businesses.manager_pin is 'Code PIN à 4 chiffres pour l''accès gérant';
