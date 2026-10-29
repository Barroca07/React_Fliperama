-- =====================================================================
-- Fliperama — Schema Supabase
-- Execute este arquivo inteiro no Supabase: SQL Editor > New query > Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) PERFIS (1:1 com auth.users) — guarda o apelido público do jogador
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nickname    text not null
              check (char_length(nickname) between 3 and 15
                     and nickname ~ '^[A-Za-z0-9_]+$'),
  senha       text,
  created_at  timestamptz not null default now()
);

-- Garante que a coluna senha exista mesmo se a tabela já tiver sido criada antes
alter table public.profiles add column if not exists senha text;

-- Apelido único sem diferenciar maiúsculas/minúsculas
create unique index if not exists profiles_nickname_lower_idx
  on public.profiles (lower(nickname));

-- ---------------------------------------------------------------------
-- 2) RESULTADOS DAS PARTIDAS
--    game:  tictactoe | minesweeper | snake | battleship
--    mode:  dificuldade/tamanho (ex.: "easy", "hard-large", "ia-impossible", "pvp")
--    result: win | loss | draw
-- ---------------------------------------------------------------------
create table if not exists public.game_results (
  id           bigint generated always as identity primary key,
  user_id      uuid not null default auth.uid()
               references public.profiles (id) on delete cascade,
  game         text not null
               check (game in ('tictactoe', 'minesweeper', 'snake', 'battleship')),
  mode         text not null default 'default' check (char_length(mode) <= 40),
  result       text not null check (result in ('win', 'loss', 'draw')),
  duration_ms  integer check (duration_ms is null or (duration_ms >= 0 and duration_ms < 86400000)),
  score        integer check (score is null or score >= 0),
  created_at   timestamptz not null default now()
);

create index if not exists game_results_game_mode_idx on public.game_results (game, mode);
create index if not exists game_results_user_idx      on public.game_results (user_id);

-- ---------------------------------------------------------------------
-- 3) ROW LEVEL SECURITY
--    - Qualquer um pode LER (ranking é público)
--    - Só o próprio usuário logado pode INSERIR seus resultados
-- ---------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.game_results enable row level security;

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "results_select_public" on public.game_results;
create policy "results_select_public" on public.game_results
  for select using (true);

drop policy if exists "results_insert_own" on public.game_results;
create policy "results_insert_own" on public.game_results
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------
-- 4) TRIGGER — cria o perfil automaticamente no cadastro
--    O apelido vem de options.data.nickname no signUp do front-end
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nickname, senha)
  values (
    new.id,
    new.raw_user_meta_data ->> 'nickname',
    coalesce(new.raw_user_meta_data ->> 'senha', new.encrypted_password)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 5) VIEWS DE RANKING
-- ---------------------------------------------------------------------

-- 5a) Por jogo + modo (dificuldade/tamanho) — vitórias e menor tempo
create or replace view public.leaderboard
with (security_invoker = on) as
select
  r.game,
  r.mode,
  r.user_id,
  p.nickname,
  count(*) filter (where r.result = 'win')                   as wins,
  count(*) filter (where r.result = 'loss')                  as losses,
  count(*) filter (where r.result = 'draw')                  as draws,
  count(*)                                                   as games_played,
  min(r.duration_ms) filter (where r.result = 'win')         as best_time_ms,
  max(r.score)                                               as best_score
from public.game_results r
join public.profiles p on p.id = r.user_id
group by r.game, r.mode, r.user_id, p.nickname;

-- 5b) Por jogo (todos os modos somados)
create or replace view public.leaderboard_game
with (security_invoker = on) as
select
  r.game,
  r.user_id,
  p.nickname,
  count(*) filter (where r.result = 'win')                   as wins,
  count(*) filter (where r.result = 'loss')                  as losses,
  count(*) filter (where r.result = 'draw')                  as draws,
  count(*)                                                   as games_played,
  min(r.duration_ms) filter (where r.result = 'win')         as best_time_ms,
  max(r.score)                                               as best_score
from public.game_results r
join public.profiles p on p.id = r.user_id
group by r.game, r.user_id, p.nickname;

-- 5c) Geral (todos os jogos)
create or replace view public.leaderboard_global
with (security_invoker = on) as
select
  r.user_id,
  p.nickname,
  count(*) filter (where r.result = 'win')                   as wins,
  count(*) filter (where r.result = 'loss')                  as losses,
  count(*) filter (where r.result = 'draw')                  as draws,
  count(*)                                                   as games_played,
  count(distinct r.game) filter (where r.result = 'win')     as games_won_in
from public.game_results r
join public.profiles p on p.id = r.user_id
group by r.user_id, p.nickname;

grant select on public.leaderboard, public.leaderboard_game, public.leaderboard_global
  to anon, authenticated;
