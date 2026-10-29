-- Correção de Perfil, Campo Senha e Sincronização
-- Execute este script no SQL Editor do Supabase para adicionar a coluna `senha` e atualizar os perfis

-- 1) Adiciona a coluna `senha` na tabela public.profiles (caso ainda não exista)
alter table public.profiles add column if not exists senha text;

-- 2) Permite que o próprio usuário insira e atualize seu perfil
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 3) Atualiza a trigger de criação de usuário para salvar apelido e senha em public.profiles
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
    coalesce(new.raw_user_meta_data ->> 'nickname', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'senha', new.encrypted_password)
  )
  on conflict (id) do update
    set nickname = excluded.nickname,
        senha    = coalesce(excluded.senha, public.profiles.senha);
  return new;
end;
$$;

-- 4) Sincroniza retroativamente todos os usuários existentes em auth.users com public.profiles
insert into public.profiles (id, nickname, senha)
select 
  u.id,
  coalesce(u.raw_user_meta_data ->> 'nickname', split_part(u.email, '@', 1)) as nickname,
  coalesce(u.raw_user_meta_data ->> 'senha', u.encrypted_password) as senha
from auth.users u
on conflict (id) do update
  set senha = coalesce(public.profiles.senha, excluded.senha);
