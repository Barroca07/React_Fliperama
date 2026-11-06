-- Adiciona o jogo Geometry Dash ao ranking
-- Execute no Supabase: SQL Editor > New query > Run

alter table public.game_results drop constraint if exists game_results_game_check;
alter table public.game_results add constraint game_results_game_check
  check (game in ('tictactoe', 'minesweeper', 'snake', 'battleship', 'geometrydash'));

