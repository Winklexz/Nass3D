-- Nass3D — schema Supabase (tabelas + Row Level Security)
-- Rode isto inteiro no SQL Editor do seu projeto Supabase.

create table public.materials (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  nome text not null default '',
  cor text not null default '#000000',
  preco numeric not null default 0,
  estoque numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  nome text not null default '',
  preco numeric not null default 0,
  custo numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.orders (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  cliente text not null default '',
  telefone text not null default '',
  item text not null default '',
  prazo text not null default '',
  status text not null default 'Pendente',
  valor numeric not null default 0,
  criado_em timestamptz not null default now()
);

create table public.sales (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  data text not null default '',
  produto text not null default '',
  comprador text not null default '',
  contato text not null default '',
  valor numeric not null default 0,
  pedido_id text,
  created_at timestamptz not null default now()
);

create table public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  meta_mensal numeric not null default 1500,
  orcamento_numero integer not null default 0,
  empresa_nome text not null default '',
  logo_data_url text not null default '',
  updated_at timestamptz not null default now()
);

-- Row Level Security: cada usuário só enxerga/edita as próprias linhas
alter table public.materials enable row level security;
alter table public.products  enable row level security;
alter table public.orders    enable row level security;
alter table public.sales     enable row level security;
alter table public.settings  enable row level security;

create policy "own rows" on public.materials for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.products  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.orders    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.sales     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.settings  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
