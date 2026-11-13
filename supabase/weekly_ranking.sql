-- =====================================================================
-- Fliperama — Ranking semanal com histórico
-- Execute no Supabase: SQL Editor > New query > Run
--
-- Nenhuma partida é apagada: as views agrupam os resultados por semana
-- (segunda a domingo, horário de Brasília). O ranking "reinicia" sozinho
-- toda segunda-feira às 00:00 e as semanas anteriores ficam no histórico.
-- =====================================================================

drop view if exists public.leaderboard cascade;
drop view if exists public.leaderboard_game cascade;
drop view if exists public.leaderboard_global cascade;
drop view if exists public.leaderboard_weeks cascade;

-- Índice para acelerar o filtro por data
create index if not exists game_results_created_at_idx on public.game_results (created_at);

-- Por semana + jogo + modo
create view public.leaderboard
with (security_invoker = on) as
select
  (date_trunc('week', r.created_at at time zone 'America/Sao_Paulo'))::date as week_start,
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
group by 1, r.game, r.mode, r.user_id, p.nickname;

-- Por semana + jogo (todos os modos)
create view public.leaderboard_game
with (security_invoker = on) as
select
  (date_trunc('week', r.created_at at time zone 'America/Sao_Paulo'))::date as week_start,
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
group by 1, r.game, r.user_id, p.nickname;

-- Por semana, geral (todos os jogos)
create view public.leaderboard_global
with (security_invoker = on) as
select
  (date_trunc('week', r.created_at at time zone 'America/Sao_Paulo'))::date as week_start,
  r.user_id,
  p.nickname,
  count(*) filter (where r.result = 'win')                   as wins,
  count(*) filter (where r.result = 'loss')                  as losses,
  count(*) filter (where r.result = 'draw')                  as draws,
  count(*)                                                   as games_played,
  count(distinct r.game) filter (where r.result = 'win')     as games_won_in
from public.game_results r
join public.profiles p on p.id = r.user_id
group by 1, r.user_id, p.nickname;

-- Lista das semanas que tiveram partidas (para o histórico)
create view public.leaderboard_weeks
with (security_invoker = on) as
select
  (date_trunc('week', created_at at time zone 'America/Sao_Paulo'))::date as week_start,
  count(*) as games_played
from public.game_results
group by 1;

grant select on public.leaderboard, public.leaderboard_game, public.leaderboard_global, public.leaderboard_weeks
  to anon, authenticated;

