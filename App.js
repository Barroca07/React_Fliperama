// ===== App.js =====

const THEME_COLORS = [
  { id: 'purple', name: 'Roxo', swatch: 'swatch-purple' },
  { id: 'black', name: 'Preto', swatch: 'swatch-black' },
  { id: 'white', name: 'Branco', swatch: 'swatch-white' },
  { id: 'red', name: 'Vermelho', swatch: 'swatch-red' },
  { id: 'blue', name: 'Azul', swatch: 'swatch-blue' },
  { id: 'green', name: 'Verde', swatch: 'swatch-green' },
  { id: 'pink', name: 'Rosa', swatch: 'swatch-pink' },
];

// Jogos exibidos na tela inicial
const HOME_GAMES = [
  {
    id: 'tictactoe',
    title: 'Jogo da Velha',
    desc: 'O clássico X contra O. Desafie um amigo ou a IA.',
    icon: 'fa-solid fa-hashtag',
    color: '#00f2ff',
    tags: ['1-2 jogadores', 'IA'],
  },
  {
    id: 'minesweeper',
    title: 'Campo Minado',
    desc: 'Revele o campo sem explodir nenhuma mina.',
    icon: 'fa-solid fa-bomb',
    color: '#ff3366',
    tags: ['Raciocínio', 'Contra o tempo'],
  },
  {
    id: 'snake',
    title: 'Cobrinha',
    desc: 'Coma as maçãs, cresça e não bata em nada.',
    icon: 'fa-solid fa-staff-snake',
    color: '#00ff73',
    tags: ['Reflexo', 'Recorde'],
  },
  {
    id: 'battleship',
    title: 'Batalha Naval',
    desc: 'Encontre e afunde toda a frota inimiga.',
    icon: 'fa-solid fa-ship',
    color: '#33bbff',
    tags: ['Estratégia', 'vs IA'],
  },
];

function App() {
  const [currentGame, setCurrentGame] = React.useState(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [authOpen, setAuthOpen] = React.useState(false);
  // Ranking começa minimizado (apenas o botão no canto superior direito)
  const [rankOpen, setRankOpen] = React.useState(false);

  // Carrega preferências do localStorage
  const [themeMode, setThemeMode] = React.useState(() => {
    return localStorage.getItem('fliperama-theme-mode') || 'dark';
  });
  const [themeColor, setThemeColor] = React.useState(() => {
    return localStorage.getItem('fliperama-theme-color') || 'purple';
  });

  // Aplica classes de tema no body
  React.useEffect(() => {
    const body = document.body;

    // Remove todas as classes de tema anteriores
    body.classList.remove('light-mode');
    THEME_COLORS.forEach(c => body.classList.remove(`theme-${c.id}`));

    // Aplica novas classes
    if (themeMode === 'light') {
      body.classList.add('light-mode');
    }
    body.classList.add(`theme-${themeColor}`);

    // Salva no localStorage
    localStorage.setItem('fliperama-theme-mode', themeMode);
    localStorage.setItem('fliperama-theme-color', themeColor);
  }, [themeMode, themeColor]);

  // Fecha os painéis ao pressionar Escape
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') { setSettingsOpen(false); setAuthOpen(false); setRankOpen(false); }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const toggleMode = () => {
    setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const goHome = () => {
    setCurrentGame(null);
    setRankOpen(false);
    setSettingsOpen(false);
  };

  const openGame = (id) => {
    setCurrentGame(id);
    setRankOpen(false);
  };

  const toggleRank = () => {
    setSettingsOpen(false);
    setRankOpen(prev => !prev);
  };

  const toggleSettings = () => {
    setRankOpen(false);
    setSettingsOpen(prev => !prev);
  };

  let content;
  if (currentGame === "tictactoe") {
    content = <TicTacToe onBackToApp={goHome} />;
  } else if (currentGame === "minesweeper") {
    content = <Minesweeper onBackToApp={goHome} />;
  } else if (currentGame === "snake") {
    content = <Snake onBackToApp={goHome} />;
  } else if (currentGame === "battleship") {
    content = <Battleship onBackToApp={goHome} />;
  } else if (currentGame === "leaderboard") {
    content = <Leaderboard onBackToApp={goHome} onOpenAuth={() => setAuthOpen(true)} />;
  } else {
    content = (
      <main className="home">
        <header className="home-hero">
          <span className="home-badge">
            <i className="fa-solid fa-gamepad"></i> {HOME_GAMES.length} jogos clássicos
          </span>
          <h1 className="home-title">Escolha seu jogo</h1>
          <p className="home-subtitle">
            Jogue de graça, sem cadastro. Entre só se quiser competir no ranking.
          </p>
        </header>

        <div className="game-grid">
          {HOME_GAMES.map((g, i) => (
            <button
              key={g.id}
              id={`home-card-${g.id}`}
              className="game-card"
              style={{ '--card-color': g.color, animationDelay: `${i * 70}ms` }}
              onClick={() => openGame(g.id)}
            >
              <div className="game-card-top">
                <span className="game-card-icon"><i className={g.icon}></i></span>
                <span className="game-card-play" aria-hidden="true">
                  <i className="fa-solid fa-play"></i>
                </span>
              </div>
              <div className="game-card-body">
                <h3>{g.title}</h3>
                <p>{g.desc}</p>
              </div>
              <div className="game-card-tags">
                {g.tags.map(t => <span key={t} className="game-card-tag">{t}</span>)}
              </div>
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <>
      {/* ===== Barra superior ===== */}
      <header className="topbar">
        <button className="brand" onClick={goHome} title="Voltar ao início">
          <span className="brand-logo"><i className="fa-solid fa-gamepad"></i></span>
          <span className="brand-name">Fliperama</span>
        </button>

        <div className="topbar-actions">
          {currentGame !== "leaderboard" && (
            <button
              id="rank-toggle-btn"
              className={`topbar-btn rank-toggle ${rankOpen ? 'active' : ''}`}
              onClick={toggleRank}
              title={rankOpen ? "Minimizar ranking" : "Abrir ranking"}
              aria-expanded={rankOpen}
            >
              <i className="fa-solid fa-trophy rank-toggle-icon"></i>
              <span className="topbar-btn-label">Ranking</span>
              <i className="fa-solid fa-chevron-down rank-chevron"></i>
            </button>
          )}

          {/* Usuário / Login (opcional, só para o ranking) */}
          <UserButton onOpenAuth={() => setAuthOpen(true)} />

          {/* Botão Engrenagem */}
          <button
            className={`settings-btn ${settingsOpen ? 'active' : ''}`}
            onClick={toggleSettings}
            title="Configurações de Tema"
          >
            <i className="fa-solid fa-gear"></i>
          </button>
        </div>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <ToastHost />

      {/* ===== Ranking (painel suspenso a partir do botão) ===== */}
      <div
        className={`rank-overlay ${rankOpen ? 'open' : ''}`}
        onClick={() => setRankOpen(false)}
      />
      {currentGame !== "leaderboard" && (
        <LeaderboardPreview
          open={rankOpen}
          onClose={() => setRankOpen(false)}
          onOpenFullLeaderboard={() => openGame("leaderboard")}
          onOpenAuth={() => { setRankOpen(false); setAuthOpen(true); }}
        />
      )}

      {/* Overlay para fechar ao clicar fora */}
      <div
        className={`settings-overlay ${settingsOpen ? 'open' : ''}`}
        onClick={() => setSettingsOpen(false)}
      />

      {/* Painel de Configurações */}
      <div className={`settings-panel ${settingsOpen ? 'open' : ''}`}>
        <div className="settings-panel-title">Configurações</div>

        {/* Toggle Claro/Escuro */}
        <div className="theme-mode-section">
          <div className="theme-mode-label">
            <i className={`fa-solid ${themeMode === 'dark' ? 'fa-moon' : 'fa-sun'}`}></i>
            {themeMode === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
          </div>
          <div
            className={`theme-mode-switch ${themeMode === 'light' ? 'light' : ''}`}
            onClick={toggleMode}
          />
        </div>

        {/* Grade de Cores */}
        <div className="theme-colors-label">Cor do Tema</div>
        <div className="theme-colors-grid">
          {THEME_COLORS.map(color => (
            <button
              key={color.id}
              className={`theme-color-option ${themeColor === color.id ? 'active' : ''}`}
              onClick={() => setThemeColor(color.id)}
              title={color.name}
            >
              <div className={`theme-color-swatch ${color.swatch}`} />
              <span className="theme-color-name">{color.name}</span>
            </button>
          ))}
        </div>
      </div>

      {content}
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
