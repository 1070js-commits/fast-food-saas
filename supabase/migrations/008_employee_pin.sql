-- Code PIN employé (4 chiffres) par commerce
alter table public.businesses
  add column if not exists employee_pin varchar(4);

comment on column public.businesses.employee_pin is 'Code PIN à 4 chiffres pour l''accès employé';
