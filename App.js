// ===== App.js =====
function App() {
  const [currentGame, setCurrentGame] = React.useState(null);
  const [isLightMode, setIsLightMode] = React.useState(false);

  React.useEffect(() => {
    document.body.classList.toggle("light-mode", isLightMode);
  }, [isLightMode]);

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
      <button 
        className="theme-toggle" 
        onClick={() => setIsLightMode(!isLightMode)}
      >
        {isLightMode ? <><i className="fa-solid fa-moon"></i> Escuro</> : <><i className="fa-solid fa-sun"></i> Claro</>}
      </button>
      {content}
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
