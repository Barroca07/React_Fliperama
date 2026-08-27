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

function App() {
  const [currentGame, setCurrentGame] = React.useState(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

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

  // Fecha o painel ao pressionar Escape
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setSettingsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const toggleMode = () => {
    setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  let content;
  if (currentGame === "tictactoe") {
    content = <TicTacToe onBackToApp={() => setCurrentGame(null)} />;
  } else if (currentGame === "minesweeper") {
    content = <Minesweeper onBackToApp={() => setCurrentGame(null)} />;
  } else if (currentGame === "snake") {
    content = <Snake onBackToApp={() => setCurrentGame(null)} />;
  } else if (currentGame === "battleship") {
    content = <Battleship onBackToApp={() => setCurrentGame(null)} />;
  } else {
    content = (
      <div className="game">
        <div className="mode-select">
          <h1>Fliperama</h1>
          <p>Escolha um jogo para começar</p>
          <div className="mode-buttons">
            <button className="mode-btn" onClick={() => setCurrentGame("tictactoe")}>
              <span className="mode-icon"><i className="fa-solid fa-hashtag"></i></span>
              <div className="mode-text">
                <strong>Jogo da Velha</strong>
                <span>Clássico jogo da velha com IA</span>
              </div>
            </button>
            <button className="mode-btn" onClick={() => setCurrentGame("minesweeper")}>
              <span className="mode-icon"><i className="fa-solid fa-bomb"></i></span>
              <div className="mode-text">
                <strong>Campo Minado</strong>
                <span>Encontre todas as minas escondidas</span>
              </div>
            </button>
            <button className="mode-btn" onClick={() => setCurrentGame("snake")}>
              <span className="mode-icon"><i className="fa-solid fa-staff-snake"></i></span>
              <div className="mode-text">
                <strong>Cobrinha</strong>
                <span>O clássico jogo do celular</span>
              </div>
            </button>
            <button className="mode-btn" onClick={() => setCurrentGame("battleship")}>
              <span className="mode-icon"><i className="fa-solid fa-ship"></i></span>
              <div className="mode-text">
                <strong>Batalha Naval</strong>
                <span>Afunde todos os navios inimigos</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Botão Engrenagem */}
      <button 
        className={`settings-btn ${settingsOpen ? 'active' : ''}`}
        onClick={() => setSettingsOpen(!settingsOpen)}
        title="Configurações de Tema"
      >
        <i className="fa-solid fa-gear"></i>
      </button>

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
