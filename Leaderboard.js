// ===== Leaderboard.js =====
// Componentes: AuthModal (login/cadastro), UserButton, ToastHost e Leaderboard (ranking).

const LB_GAMES = [
  { id: "all", label: "Geral", icon: "fa-solid fa-globe" },
  { id: "tictactoe", label: "Jogo da Velha", icon: "fa-solid fa-hashtag" },
  { id: "minesweeper", label: "Campo Minado", icon: "fa-solid fa-bomb" },
  { id: "snake", label: "Cobrinha", icon: "fa-solid fa-staff-snake" },
  { id: "battleship", label: "Batalha Naval", icon: "fa-solid fa-ship" },
];

const LB_MODES = {
  tictactoe: [
    { id: "ia-easy", label: "IA Fácil" },
    { id: "ia-medium", label: "IA Médio" },
    { id: "ia-hard", label: "IA Difícil" },
    { id: "ia-impossible", label: "IA Imbatível" },
    { id: "pvp", label: "2 Jogadores" },
  ],
  minesweeper: [
    { id: "easy", label: "Fácil" },
    { id: "medium", label: "Médio" },
    { id: "hard", label: "Difícil" },
  ],
  snake: ["easy", "medium", "hard"].flatMap((d) =>
    [10, 14, 18].map((s) => ({
      id: `${d}-${s}`,
      label: `${{ easy: "Fácil", medium: "Médio", hard: "Difícil" }[d]} ${s}x${s}`,
    }))
  ),
  battleship: ["easy", "medium", "hard"].flatMap((d) =>
    ["small", "medium", "large"].map((s) => ({
      id: `${d}-${s}`,
      label: `${{ easy: "Fácil", medium: "Médio", hard: "Difícil" }[d]} / ${{ small: "Pequeno", medium: "Médio", large: "Grande" }[s]}`,
    }))
  ),
};

// ===== Modal de Login / Cadastro =====
function AuthModal({ open, onClose }) {
  const [tab, setTab] = React.useState("login");
  const [nickname, setNickname] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) { setError(""); setPassword(""); setConfirm(""); }
  }, [open, tab]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (tab === "signup" && password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    try {
      if (tab === "login") await FliperamaAuth.signIn(nickname, password);
      else await FliperamaAuth.signUp(nickname, password);
      showToast(tab === "login" ? `Bem-vindo de volta, ${nickname.trim()}!` : `Conta criada! Boa sorte, ${nickname.trim()}!`, "success");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="auth-close" id="auth-close-btn" onClick={onClose} aria-label="Fechar">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="auth-icon"><i className="fa-solid fa-trophy"></i></div>
        <h2 id="auth-title" className="auth-title">{tab === "login" ? "Entrar no Ranking" : "Criar Conta"}</h2>
        <p className="auth-subtitle">Jogue livremente — faça login apenas para competir no ranking.</p>

        <div className="auth-tabs">
          <button id="auth-tab-login" className={`auth-tab ${tab === "login" ? "active" : ""}`} onClick={() => setTab("login")}>Entrar</button>
          <button id="auth-tab-signup" className={`auth-tab ${tab === "signup" ? "active" : ""}`} onClick={() => setTab("signup")}>Cadastrar</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span><i className="fa-solid fa-user"></i> Apelido</span>
            <input
              id="auth-nickname"
              className="name-input"
              type="text"
              autoComplete="username"
              value={nickname}
              maxLength={15}
              placeholder="ex: Player_01"
              onChange={(e) => setNickname(e.target.value.replace(/[^A-Za-z0-9_]/g, ""))}
              autoFocus
            />
          </label>
          <label className="auth-field">
            <span><i className="fa-solid fa-lock"></i> Senha</span>
            <input
              id="auth-password"
              className="name-input"
              type="password"
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              value={password}
              placeholder="mínimo 6 caracteres"
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {tab === "signup" && (
            <label className="auth-field">
              <span><i className="fa-solid fa-lock"></i> Confirmar senha</span>
              <input
                id="auth-password-confirm"
                className="name-input"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
          )}

          {error && <div className="auth-error"><i className="fa-solid fa-circle-exclamation"></i> {error}</div>}

          <button id="auth-submit" type="submit" className="btn btn-next auth-submit" disabled={busy}>
            {busy ? <i className="fa-solid fa-spinner fa-spin"></i> : (tab === "login" ? "Entrar" : "Criar conta")}
          </button>
        </form>
      </div>
    </div>
  );
}

// ===== Botão de usuário (canto superior) =====
function UserButton({ onOpenAuth }) {
  const auth = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  if (auth.loading) return null;

  if (!auth.user) {
    return (
      <button id="user-login-btn" className="user-btn" onClick={onOpenAuth} title="Entrar para o ranking">
        <i className="fa-solid fa-right-to-bracket"></i>
        <span>Entrar</span>
      </button>
    );
  }

  return (
    <div className="user-menu-wrapper">
      <button id="user-menu-btn" className={`user-btn logged ${menuOpen ? "active" : ""}`} onClick={() => setMenuOpen(!menuOpen)}>
        <span className="user-avatar">{auth.nickname.charAt(0).toUpperCase()}</span>
        <span>{auth.nickname}</span>
        <i className="fa-solid fa-chevron-down user-chevron"></i>
      </button>
      {menuOpen && (
        <div className="user-dropdown">
          <button
            id="user-logout-btn"
            onClick={async () => { setMenuOpen(false); await FliperamaAuth.signOut(); showToast("Você saiu da conta.", "info"); }}
          >
            <i className="fa-solid fa-right-from-bracket"></i> Sair
          </button>
        </div>
      )}
    </div>
  );
}

// ===== Toasts =====
function ToastHost() {
  const [toasts, setToasts] = React.useState([]);

  React.useEffect(() => {
    function onToast(e) {
      const t = e.detail;
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3500);
    }
    window.addEventListener("fliperama:toast", onToast);
    return () => window.removeEventListener("fliperama:toast", onToast);
  }, []);

  const icons = { success: "fa-circle-check", error: "fa-circle-xmark", info: "fa-circle-info" };
  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <i className={`fa-solid ${icons[t.type] || icons.info}`}></i>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ===== Tela de Ranking =====
function Leaderboard({ onBackToApp, onOpenAuth }) {
  const auth = useAuth();
  const [game, setGame] = React.useState("all");
  const [mode, setMode] = React.useState("all");
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => { setMode("all"); }, [game]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchLeaderboard({ game, mode })
      .then((data) => { if (!cancelled) setRows(data); })
      .catch((err) => { if (!cancelled) { console.error(err); setError("Não foi possível carregar o ranking. Verifique se o schema.sql foi executado no Supabase."); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [game, mode]);

  const isSnake = game === "snake";
  const isGlobal = game === "all";
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="game lb-game">
      <div className="lb-header">
        <div className="lb-trophy"><i className="fa-solid fa-trophy"></i></div>
        <h1 className="lb-title">Ranking</h1>
        <p className="lb-subtitle">
          {isGlobal ? "Total de vitórias em todos os jogos"
            : isSnake ? "Maior pontuação"
            : "Mais vitórias • desempate pelo menor tempo"}
        </p>
      </div>

      <div className="lb-tabs" role="tablist">
        {LB_GAMES.map((g) => (
          <button
            key={g.id}
            id={`lb-tab-${g.id}`}
            role="tab"
            aria-selected={game === g.id}
            className={`lb-tab ${game === g.id ? "active" : ""}`}
            onClick={() => setGame(g.id)}
          >
            <i className={g.icon}></i>
            <span>{g.label}</span>
          </button>
        ))}
      </div>

      {!isGlobal && (
        <div className="lb-modes">
          <button id="lb-mode-all" className={`lb-chip ${mode === "all" ? "active" : ""}`} onClick={() => setMode("all")}>Todos</button>
          {LB_MODES[game].map((m) => (
            <button key={m.id} id={`lb-mode-${m.id}`} className={`lb-chip ${mode === m.id ? "active" : ""}`} onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      <div className="lb-table-wrapper">
        {loading ? (
          <div className="lb-empty"><i className="fa-solid fa-spinner fa-spin"></i> Carregando...</div>
        ) : error ? (
          <div className="lb-empty lb-error"><i className="fa-solid fa-triangle-exclamation"></i> {error}</div>
        ) : rows.length === 0 ? (
          <div className="lb-empty"><i className="fa-solid fa-ghost"></i> Nenhuma partida registrada ainda. Seja o primeiro!</div>
        ) : (
          <table className="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Jogador</th>
                {isSnake ? (
                  <>
                    <th>Recorde</th>
                    <th>Partidas</th>
                  </>
                ) : (
                  <>
                    <th>Vitórias</th>
                    {isGlobal ? <th>Partidas</th> : <th>Melhor tempo</th>}
                    <th>% Vit.</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isMe = auth.user && r.user_id === auth.user.id;
                const winRate = r.games_played ? Math.round((r.wins / r.games_played) * 100) : 0;
                return (
                  <tr key={r.user_id + (r.mode || "")} className={`${i < 3 ? `lb-top lb-top-${i + 1}` : ""} ${isMe ? "lb-me" : ""}`} style={{ animationDelay: `${i * 40}ms` }}>
                    <td className="lb-rank">{i < 3 ? medals[i] : i + 1}</td>
                    <td className="lb-player">
                      <span className="user-avatar small">{r.nickname.charAt(0).toUpperCase()}</span>
                      {r.nickname}{isMe && <span className="lb-you">você</span>}
                    </td>
                    {isSnake ? (
                      <>
                        <td className="lb-strong">{r.best_score ?? 0}</td>
                        <td>{r.games_played}</td>
                      </>
                    ) : (
                      <>
                        <td className="lb-strong">{r.wins}</td>
                        {isGlobal ? <td>{r.games_played}</td> : <td className="lb-time">{formatDuration(r.best_time_ms)}</td>}
                        <td>{winRate}%</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!auth.loading && !auth.user && (
        <button id="lb-login-cta" className="btn btn-next" style={{ marginTop: "16px" }} onClick={onOpenAuth}>
          <i className="fa-solid fa-right-to-bracket"></i> Entrar para competir
        </button>
      )}

      <div className="action-buttons" style={{ marginTop: "12px" }}>
        <button id="lb-back-btn" className="btn btn-back" onClick={onBackToApp}>← Menu Principal</button>
      </div>
    </div>
  );
}

// ===== Pré-visualização do Ranking (painel suspenso no canto superior direito) =====
// Fica minimizado por padrão; abre ao clicar no botão "Ranking" da barra superior.
function LeaderboardPreview({ open, onClose, onOpenFullLeaderboard, onOpenAuth }) {
  const auth = useAuth();
  const [game, setGame] = React.useState("all");
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    // Só busca os dados quando o painel está aberto
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchLeaderboard({ game, mode: "all", limit: 5 })
      .then((data) => {
        if (!cancelled) setRows(data || []);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("[LeaderboardPreview]", err);
          setError("Aguardando schema no Supabase");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, game, reloadKey, auth.user]);

  const medals = ["🥇", "🥈", "🥉"];
  const isSnake = game === "snake";
  const isGlobal = game === "all";

  return (
    <aside
      className={`lb-preview-card ${open ? "open" : ""}`}
      aria-label="Pré-visualização do Ranking"
      aria-hidden={!open}
    >
      <div className="lb-preview-header">
        <div className="lb-preview-title-box">
          <span className="lb-preview-icon"><i className="fa-solid fa-trophy"></i></span>
          <div>
            <h2 className="lb-preview-title">Ranking</h2>
            <span className="lb-preview-tag">Top 5 Jogadores</span>
          </div>
        </div>
        <div className="lb-preview-header-actions">
          <button
            className="lb-preview-refresh-btn"
            title="Atualizar ranking"
            onClick={() => setReloadKey((k) => k + 1)}
            disabled={loading}
          >
            <i className={`fa-solid fa-rotate-right ${loading ? "fa-spin" : ""}`}></i>
          </button>
          <button
            id="lb-preview-minimize"
            className="lb-preview-refresh-btn lb-preview-close-btn"
            title="Minimizar ranking"
            onClick={onClose}
          >
            <i className="fa-solid fa-minus"></i>
          </button>
        </div>
      </div>

      {/* Seletor rápido de jogo */}
      <div className="lb-preview-tabs">
        {[
          { id: "all", label: "Geral", short: "Geral", icon: "fa-solid fa-globe" },
          { id: "tictactoe", label: "Jogo da Velha", short: "Velha", icon: "fa-solid fa-hashtag" },
          { id: "minesweeper", label: "Campo Minado", short: "Minas", icon: "fa-solid fa-bomb" },
          { id: "snake", label: "Cobrinha", short: "Cobra", icon: "fa-solid fa-staff-snake" },
          { id: "battleship", label: "Batalha Naval", short: "Naval", icon: "fa-solid fa-ship" },
        ].map((g) => (
          <button
            key={g.id}
            className={`lb-preview-tab ${game === g.id ? "active" : ""}`}
            onClick={() => setGame(g.id)}
            title={g.label}
          >
            <i className={g.icon}></i>
            <span className="lb-preview-tab-text">{g.short}</span>
          </button>
        ))}
      </div>

      {/* Lista de Melhores Jogadores */}
      <div className="lb-preview-list">
        {loading ? (
          <div className="lb-preview-loading">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <span>Carregando ranking...</span>
          </div>
        ) : error ? (
          <div className="lb-preview-empty warning">
            <i className="fa-solid fa-circle-exclamation"></i>
            <p>Execute o <code>fix_profiles.sql</code> no Supabase.</p>
            <button className="btn btn-back" style={{ fontSize: "0.75rem", padding: "4px 10px", marginTop: "8px" }} onClick={() => setReloadKey((k) => k + 1)}>
              Tentar novamente
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="lb-preview-empty">
            <i className="fa-solid fa-trophy" style={{ fontSize: "2rem", color: "#ffcc00", opacity: 0.6 }}></i>
            <p style={{ fontWeight: 700, color: "var(--text-color)" }}>Pódio Vazio</p>
            <span className="lb-preview-hint">Jogue uma partida e conquiste o 1º lugar!</span>
          </div>
        ) : (
          <>
            {rows.slice(0, 5).map((r, i) => {
              const isMe = auth.user && r.user_id === auth.user.id;
              return (
                <div
                  key={r.user_id + (r.mode || "")}
                  className={`lb-preview-item ${i < 3 ? `top-${i + 1}` : ""} ${isMe ? "is-me" : ""}`}
                >
                  <div className="lb-preview-rank">
                    {i === 0 ? (
                      <span className="lb-medal crown-glow" title="1º Lugar">🥇</span>
                    ) : i < 3 ? (
                      <span className="lb-medal">{medals[i]}</span>
                    ) : (
                      <span className="lb-num">#{i + 1}</span>
                    )}
                  </div>
                  <div className={`user-avatar small ${i === 0 ? "avatar-leader" : ""}`}>
                    {r.nickname ? r.nickname.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="lb-preview-user-info">
                    <span className="lb-preview-name" title={r.nickname}>
                      {r.nickname}
                      {isMe && <span className="lb-you">você</span>}
                    </span>
                    <span className="lb-preview-detail">
                      {isSnake
                        ? `${r.games_played || 1} partida${(r.games_played || 1) > 1 ? "s" : ""}`
                        : `${r.games_played || 0} jogos • ${(r.wins && r.games_played) ? Math.round((r.wins / r.games_played) * 100) : 0}% vit.`}
                    </span>
                  </div>
                  <div className="lb-preview-stat">
                    {isSnake ? (
                      <span className="lb-preview-score">
                        <i className="fa-solid fa-apple-whole"></i> {r.best_score ?? 0}
                      </span>
                    ) : (
                      <>
                        <span className="lb-preview-wins">
                          <i className="fa-solid fa-crown"></i> {r.wins} vit.
                        </span>
                        {!isGlobal && r.best_time_ms && (
                          <span className="lb-preview-time"><i className="fa-solid fa-stopwatch"></i> {formatDuration(r.best_time_ms)}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Slots abertos de incentivo se houver menos de 3 no pódio */}
            {rows.length < 3 && [2, 3].slice(rows.length - 1).map((pos) => (
              <div key={`open-slot-${pos}`} className="lb-preview-item open-slot">
                <div className="lb-preview-rank">
                  <span className="lb-medal open-slot-icon">{pos === 2 ? "🥈" : "🥉"}</span>
                </div>
                <div className="user-avatar small open-slot-avatar">
                  <i className="fa-solid fa-plus"></i>
                </div>
                <div className="lb-preview-user-info">
                  <span className="lb-preview-name open-slot-title">Vaga Aberta #{pos}</span>
                  <span className="lb-preview-detail">Vença para entrar no pódio</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* CTA de Login se não logado */}
      {!auth.loading && !auth.user && (
        <div className="lb-preview-login-cta" onClick={onOpenAuth}>
          <i className="fa-solid fa-right-to-bracket"></i>
          <span>Entre com seu apelido para pontuar</span>
        </div>
      )}

      {/* Rodapé: Ver Ranking Completo */}
      <button
        id="lb-preview-view-all"
        className="btn btn-next lb-preview-view-all"
        onClick={onOpenFullLeaderboard}
      >
        <span>Ver Ranking Completo</span>
        <i className="fa-solid fa-arrow-right"></i>
      </button>
    </aside>
  );
}

