// ===== App.js =====
function App() {
  const [currentGame, setCurrentGame] = React.useState(null);

  if (currentGame === "tictactoe") {
    return <TicTacToe onBackToApp={() => setCurrentGame(null)} />;
  }

  if (currentGame === "minesweeper") {
    return <Minesweeper onBackToApp={() => setCurrentGame(null)} />;
  }

  return (
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
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
