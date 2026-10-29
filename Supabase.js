// ===== Supabase.js =====
// Cliente Supabase + autenticação (apelido + senha) + registro de partidas.
// Os jogos funcionam normalmente sem login; logado, os resultados vão para o ranking.

const SUPABASE_URL = "https://mnslsugxbomafdxiurdn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Rzr8wVcbeM3B0pbTDOxGYg_sB7JQo6E";

// O Supabase Auth exige email; geramos um email interno a partir do apelido.
const NICKNAME_EMAIL_DOMAIN = "fliperama.app";
const NICKNAME_REGEX = /^[A-Za-z0-9_]{3,15}$/;

const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

function nicknameToEmail(nickname) {
  return `${nickname.trim().toLowerCase()}@${NICKNAME_EMAIL_DOMAIN}`;
}

function translateAuthError(error) {
  const msg = (error && error.message) || "";
  if (/already registered|already exists/i.test(msg)) return "Esse apelido já está em uso.";
  if (/invalid login credentials/i.test(msg)) return "Apelido ou senha incorretos.";
  if (/password should be at least/i.test(msg)) return "A senha precisa ter pelo menos 6 caracteres.";
  if (/email not confirmed/i.test(msg)) return "Confirmação de email está ativa no Supabase. Desative em Authentication > Sign In / Providers > Email.";
  if (/rate limit/i.test(msg)) return "Muitas tentativas. Aguarde um pouco e tente novamente.";
  if (/duplicate key|profiles_nickname/i.test(msg)) return "Esse apelido já está em uso.";
  return msg || "Erro inesperado. Tente novamente.";
}

// ===== Toast global (feedback rápido) =====
function showToast(message, type = "info") {
  window.dispatchEvent(new CustomEvent("fliperama:toast", { detail: { message, type, id: Date.now() + Math.random() } }));
}

// ===== Store de autenticação (fora do React, compartilhado por todos os componentes) =====
const FliperamaAuth = (() => {
  let state = { loading: true, user: null, nickname: null };
  const listeners = new Set();

  function setState(next) {
    state = { ...state, ...next };
    listeners.forEach((fn) => fn(state));
  }

  async function applySession(session) {
    const user = session ? session.user : null;
    const nickname = user ? (user.user_metadata && user.user_metadata.nickname) || user.email.split("@")[0] : null;
    const senha = user && user.user_metadata ? user.user_metadata.senha : null;
    setState({
      loading: false,
      user,
      nickname,
    });
    if (user && nickname) {
      try {
        const payload = { id: user.id, nickname };
        if (senha) payload.senha = senha;
        await sbClient.from("profiles").upsert(payload, { onConflict: "id" });
      } catch (err) {
        console.warn("[Fliperama] Upsert profiles:", err);
      }
    }
  }

  sbClient.auth.getSession().then(({ data }) => applySession(data.session));
  sbClient.auth.onAuthStateChange((_event, session) => applySession(session));

  return {
    getState: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    async signUp(nickname, password) {
      nickname = nickname.trim();
      if (!NICKNAME_REGEX.test(nickname)) {
        throw new Error("Apelido deve ter 3 a 15 caracteres (letras, números ou _).");
      }
      const { data, error } = await sbClient.auth.signUp({
        email: nicknameToEmail(nickname),
        password,
        options: { data: { nickname, senha: password } },
      });
      if (error) throw new Error(translateAuthError(error));
      // Se "Confirm email" estiver ligado, o Supabase não retorna sessão
      if (!data.session) {
        throw new Error("Conta criada, mas o Supabase exige confirmação de email. Desative em Authentication > Sign In / Providers > Email > Confirm email.");
      }
      if (data.user) {
        try {
          await sbClient.from("profiles").upsert(
            { id: data.user.id, nickname, senha: password },
            { onConflict: "id" }
          );
        } catch (err) {
          console.warn("[Fliperama] Upsert profiles no signUp:", err);
        }
      }
      return data;
    },

    async signIn(nickname, password) {
      nickname = nickname.trim();
      if (!nickname || !password) throw new Error("Preencha apelido e senha.");
      const { data, error } = await sbClient.auth.signInWithPassword({
        email: nicknameToEmail(nickname),
        password,
      });
      if (error) throw new Error(translateAuthError(error));
      if (data.user) {
        try {
          const resolvedNick =
            (data.user.user_metadata && data.user.user_metadata.nickname) || nickname;
          await sbClient.from("profiles").upsert(
            { id: data.user.id, nickname: resolvedNick, senha: password },
            { onConflict: "id" }
          );
        } catch (err) {
          console.warn("[Fliperama] Upsert profiles no signIn:", err);
        }
      }
      return data;
    },

    async signOut() {
      await sbClient.auth.signOut();
    },
  };
})();

// Hook React para acessar o usuário logado
function useAuth() {
  const [auth, setAuth] = React.useState(FliperamaAuth.getState());
  React.useEffect(() => FliperamaAuth.subscribe(setAuth), []);
  return auth;
}

// ===== Registro de partidas =====
// game: 'tictactoe' | 'minesweeper' | 'snake' | 'battleship'
// mode: dificuldade/tamanho, ex. 'hard', 'medium-14', 'ia-impossible', 'pvp'
// result: 'win' | 'loss' | 'draw'
async function recordGameResult({ game, mode, result, durationMs = null, score = null }) {
  const { user } = FliperamaAuth.getState();
  if (!user) {
    if (result === "win" || game === "snake") {
      showToast("Entre com seu apelido para aparecer no ranking!", "info");
    }
    return null;
  }

  // Garante que o jogador possui perfil em public.profiles antes de salvar o resultado
  try {
    const nick = (user.user_metadata && user.user_metadata.nickname) || user.email.split("@")[0];
    await sbClient.from("profiles").upsert({ id: user.id, nickname: nick }, { onConflict: "id" });
  } catch (err) {
    console.warn("[Fliperama] Upsert profiles antes do resultado:", err);
  }

  const { error } = await sbClient.from("game_results").insert({
    user_id: user.id,
    game,
    mode,
    result,
    duration_ms: durationMs != null ? Math.round(durationMs) : null,
    score,
  });

  if (error) {
    console.error("[Fliperama] Erro ao salvar resultado:", error);
    showToast("Não foi possível salvar no ranking.", "error");
    return null;
  }

  if (result === "win") showToast(`Vitória registrada no ranking! (${formatDuration(durationMs)})`, "success");
  else if (game === "snake") showToast(`Pontuação ${score} registrada no ranking!`, "success");
  return true;
}

// ===== Consultas de ranking =====
async function fetchLeaderboard({ game = "all", mode = "all", limit = 50 }) {
  let query;
  if (game === "all") {
    query = sbClient
      .from("leaderboard_global")
      .select("*")
      .order("wins", { ascending: false })
      .order("games_played", { ascending: true });
  } else {
    const view = mode === "all" ? "leaderboard_game" : "leaderboard";
    query = sbClient.from(view).select("*").eq("game", game);
    if (mode !== "all") query = query.eq("mode", mode);

    if (game === "snake") {
      query = query.order("best_score", { ascending: false, nullsFirst: false });
    } else {
      query = query
        .order("wins", { ascending: false })
        .order("best_time_ms", { ascending: true, nullsFirst: false });
    }
  }

  const { data, error } = await query.limit(limit);
  if (error) throw error;
  return data || [];
}

// ===== Utilitários =====
function formatDuration(ms) {
  if (ms == null) return "—";
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

window.FliperamaDB = { sbClient, FliperamaAuth, recordGameResult, fetchLeaderboard, formatDuration, showToast };
