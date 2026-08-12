// ===== Componente: Quadrado =====
function Square({ value, onSquareClick, isWinCell }) {
  const classNames = [
    "square",
    value ? "filled" : "",
    value === "X" ? "x-mark" : "",
    value === "O" ? "o-mark" : "",
    isWinCell ? "win-cell" : "",
  ].filter(Boolean).join(" ");

  return (
    <button
      className={classNames}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault();
        onSquareClick();
      }}
    >
      {value}
    </button>
  );
}

// ===== Componente: Tabuleiro =====
function Board({ xIsNext, squares, onPlay, disabled, players }) {
  const winInfo = calculateWinner(squares);

  function handleClick(i) {
    if (disabled || squares[i] || winInfo) return;
    const nextSquares = squares.slice();
    nextSquares[i] = xIsNext ? "X" : "O";
    onPlay(nextSquares);
  }

  // Determinar status
  let status;
  let statusClass = "";
  if (winInfo) {
    const winnerName = winInfo.winner === "X" ? players.X : players.O;
    status = <span><i className="fa-solid fa-trophy"></i> Vencedor: {winnerName}</span>;
    statusClass = winInfo.winner === "X" ? "winner status-x" : "winner status-o";
  } else if (!squares.includes(null)) {
    status = <span><i className="fa-solid fa-handshake"></i> Empate!</span>;
    statusClass = "status-draw";
  } else {
    const next = xIsNext ? "X" : "O";
    const nextName = xIsNext ? players.X : players.O;
    status = "Vez de: " + nextName;
    statusClass = next === "X" ? "status-x" : "status-o";
  }

  const winCells = winInfo ? winInfo.line : [];

  return (
    <>
      <div className={`status ${statusClass}`}>{status}</div>
      <div className="board">
        {squares.map((sq, i) => (
          <Square
            key={i}
            value={sq}
            onSquareClick={() => handleClick(i)}
            isWinCell={winCells.includes(i)}
          />
        ))}
      </div>
    </>
  );
}

// ===== Componente: Placar =====
function Scoreboard({ score, players }) {
  return (
    <div className="scoreboard">
      <div className="score-item x-score">
        <span className="score-label">{players.X}</span>
        <span className="score-value">{score.X}</span>
      </div>
      <div className="score-item draw-score">
        <span className="score-label">Empates</span>
        <span className="score-value">{score.draws}</span>
      </div>
      <div className="score-item o-score">
        <span className="score-label">{players.O}</span>
        <span className="score-value">{score.O}</span>
      </div>
    </div>
  );
}

// ===== Componente: Seleção de Modo =====
function ModeSelect({ onSelectMode, onBackToApp }) {
  const [showDifficulty, setShowDifficulty] = React.useState(false);

  if (showDifficulty) {
    return (
      <div className="mode-select">
        <h1>Dificuldade</h1>
        <p>Escolha o nível da Inteligência Artificial</p>
        <div className="mode-buttons">
          <button className="mode-btn" onClick={() => onSelectMode("pvc", "easy")}>
            <span className="mode-icon" style={{color: '#00ff73'}}><i className="fa-solid fa-circle"></i></span>
            <div className="mode-text">
              <strong>Fácil</strong>
              <span>A IA faz jogadas aleatórias</span>
            </div>
          </button>
          <button className="mode-btn" onClick={() => onSelectMode("pvc", "medium")}>
            <span className="mode-icon" style={{color: '#ffcc00'}}><i className="fa-solid fa-circle"></i></span>
            <div className="mode-text">
              <strong>Médio</strong>
              <span>A IA mescla estratégias</span>
            </div>
          </button>
          <button className="mode-btn" onClick={() => onSelectMode("pvc", "hard")}>
            <span className="mode-icon" style={{color: '#ff6600'}}><i className="fa-solid fa-circle"></i></span>
            <div className="mode-text">
              <strong>Difícil</strong>
              <span>A IA comete poucos erros</span>
            </div>
          </button>
          <button className="mode-btn" onClick={() => onSelectMode("pvc", "impossible")}>
            <span className="mode-icon" style={{color: '#ff0055'}}><i className="fa-solid fa-skull"></i></span>
            <div className="mode-text">
              <strong>Imbatível</strong>
              <span>A IA nunca perde</span>
            </div>
          </button>
          <button className="mode-btn" style={{marginTop: "10px", justifyContent: "center", border: "1px solid #333"}} onClick={() => setShowDifficulty(false)}>
            <div className="mode-text">
              <span>Voltar</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mode-select">
      <h1>Jogo da Velha</h1>
      <p>Escolha o modo de jogo</p>
      <div className="mode-buttons">
        <button className="mode-btn" onClick={() => onSelectMode("pvp", null)}>
          <span className="mode-icon"><i className="fa-solid fa-user-group"></i></span>
          <div className="mode-text">
            <strong>Dois Jogadores</strong>
            <span>Jogue contra um amigo no mesmo dispositivo</span>
          </div>
        </button>
        <button className="mode-btn" onClick={() => setShowDifficulty(true)}>
          <span className="mode-icon"><i className="fa-solid fa-robot"></i></span>
          <div className="mode-text">
            <strong>Contra a Máquina</strong>
            <span>Desafie a inteligência artificial</span>
          </div>
        </button>
      </div>
      {onBackToApp && (
        <button className="btn btn-back" style={{marginTop: "20px"}} onClick={onBackToApp}>
          ← Menu Principal
        </button>
      )}
    </div>
  );
}

// ===== Componente: Setup de Jogadores =====
function PlayerSetup({ gameMode, onStart, onBack }) {
  const [player1Name, setPlayer1Name] = React.useState(gameMode === "pvc" ? "Jogador" : "Jogador 1");
  const [player2Name, setPlayer2Name] = React.useState(gameMode === "pvc" ? "Máquina" : "Jogador 2");
  const [player1Is, setPlayer1Is] = React.useState("X");

  function handleStart() {
    const p1 = player1Name.trim() || (gameMode === "pvc" ? "Jogador" : "Jogador 1");
    const p2 = player2Name.trim() || (gameMode === "pvc" ? "Máquina" : "Jogador 2");
    
    const pX = player1Is === "X" ? p1 : p2;
    const pO = player1Is === "X" ? p2 : p1;
    
    onStart({ X: pX, O: pO }, player1Is);
  }

  return (
    <div className="mode-select">
      <h1>Configuração</h1>
      
      <div className="setup-form">
        <div className="form-group">
          <label>{gameMode === "pvc" ? "Seu Nome:" : "Nome do Jogador 1:"}</label>
          <input 
            type="text" 
            className="name-input" 
            value={player1Name} 
            onChange={e => setPlayer1Name(e.target.value)} 
            maxLength={15}
          />
        </div>

        {gameMode === "pvp" && (
          <div className="form-group">
            <label>Nome do Jogador 2:</label>
            <input 
              type="text" 
              className="name-input" 
              value={player2Name} 
              onChange={e => setPlayer2Name(e.target.value)} 
              maxLength={15}
            />
          </div>
        )}

        <div className="form-group">
          <label>{gameMode === "pvc" ? "Você quer jogar com:" : "Jogador 1 joga com:"}</label>
          <div className="symbol-toggle">
            <button 
              className={`toggle-btn ${player1Is === "X" ? "active x-active" : ""}`} 
              onClick={() => setPlayer1Is("X")}
            >X</button>
            <button 
              className={`toggle-btn ${player1Is === "O" ? "active o-active" : ""}`} 
              onClick={() => setPlayer1Is("O")}
            >O</button>
          </div>
        </div>
      </div>

      <div className="action-buttons" style={{marginTop: "10px"}}>
        <button className="btn btn-next" onClick={handleStart}>Começar Partida</button>
        <button className="btn btn-back" onClick={onBack}>Voltar</button>
      </div>
    </div>
  );
}

// ===== Componente Principal: TicTacToe =====
function TicTacToe({ onBackToApp }) {
  const [gameMode, setGameMode] = React.useState(null); // null, "pvp", "pvc"
  const [difficulty, setDifficulty] = React.useState(null); // null, "easy", "medium", "hard"
  const [isSettingUp, setIsSettingUp] = React.useState(false);
  const [players, setPlayers] = React.useState({ X: "Jogador X", O: "Jogador O" });
  const [aiSymbol, setAiSymbol] = React.useState("O");

  const [squares, setSquares] = React.useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = React.useState(true);
  const [score, setScore] = React.useState({ X: 0, O: 0, draws: 0 });
  const [gameStarter, setGameStarter] = React.useState("X");
  const [gameOver, setGameOver] = React.useState(false);
  const [aiThinking, setAiThinking] = React.useState(false);

  // Efeito: IA joga quando é a vez dela
  React.useEffect(() => {
    if (gameMode !== "pvc" || gameOver) return;
    
    const isAiTurn = (xIsNext && aiSymbol === "X") || (!xIsNext && aiSymbol === "O");
    if (!isAiTurn) return;

    const winInfo = calculateWinner(squares);
    if (winInfo || !squares.includes(null)) return;

    setAiThinking(true);
    const timer = setTimeout(() => {
      const bestMove = getBestMove(squares, difficulty, aiSymbol);
      if (bestMove !== -1) {
        const nextSquares = squares.slice();
        nextSquares[bestMove] = aiSymbol;
        setSquares(nextSquares);
        setXIsNext(aiSymbol === "O"); // Se a IA for X, a próxima é false (O); se for O, a próxima é true (X)
      }
      setAiThinking(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [squares, xIsNext, gameMode, gameOver, aiSymbol, difficulty]);

  // Efeito: Verificar fim de jogo e atualizar placar
  React.useEffect(() => {
    const winInfo = calculateWinner(squares);
    if (winInfo) {
      if (!gameOver) {
        setScore((prev) => ({ ...prev, [winInfo.winner]: prev[winInfo.winner] + 1 }));
        setGameOver(true);
      }
    } else if (!squares.includes(null)) {
      if (!gameOver) {
        setScore((prev) => ({ ...prev, draws: prev.draws + 1 }));
        setGameOver(true);
      }
    }
  }, [squares]);

  function handlePlay(nextSquares) {
    setSquares(nextSquares);
    setXIsNext(!xIsNext);
  }

  function resetGame() {
    const nextStarter = gameStarter === "X" ? "O" : "X";
    setGameStarter(nextStarter);
    setSquares(Array(9).fill(null));
    setXIsNext(nextStarter === "X");
    setGameOver(false);
    setAiThinking(false);
  }

  function selectMode(mode, diff) {
    setGameMode(mode);
    setDifficulty(diff);
    setIsSettingUp(true);
  }

  function handleSetupStart(playersConfig, p1Symbol) {
    setPlayers(playersConfig);
    if (gameMode === "pvc") {
      setAiSymbol(p1Symbol === "X" ? "O" : "X");
    }
    setIsSettingUp(false);
    setGameStarter("X");
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setScore({ X: 0, O: 0, draws: 0 });
    setGameOver(false);
    setAiThinking(false);
  }

  function backToMenu() {
    setGameMode(null);
    setDifficulty(null);
    setIsSettingUp(false);
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setGameStarter("X");
    setScore({ X: 0, O: 0, draws: 0 });
    setGameOver(false);
    setAiThinking(false);
  }

  // Tela de seleção de modo
  if (!gameMode) {
    return (
      <div className="game">
        <ModeSelect onSelectMode={selectMode} onBackToApp={onBackToApp} />
      </div>
    );
  }

  // Tela de configuração de jogadores
  if (isSettingUp) {
    return (
      <div className="game">
        <PlayerSetup 
          gameMode={gameMode} 
          onStart={handleSetupStart} 
          onBack={backToMenu} 
        />
      </div>
    );
  }

  const diffLabels = { easy: "Fácil", medium: "Médio", hard: "Difícil", impossible: "Imbatível" };
  const modeLabel = gameMode === "pvp" ? "Jogador vs Jogador" : `Jogador vs Máquina (${diffLabels[difficulty]})`;
  const isAiTurn = gameMode === "pvc" && ((xIsNext && aiSymbol === "X") || (!xIsNext && aiSymbol === "O"));
  const isDisabled = aiThinking || isAiTurn || gameOver;

  return (
    <div className="game">
      <div className="mode-indicator">{modeLabel}</div>
      <Scoreboard score={score} players={players} />
      <Board
        xIsNext={xIsNext}
        squares={squares}
        onPlay={handlePlay}
        disabled={isDisabled}
        players={players}
      />
      <div className="action-buttons">
        <button className="btn btn-next" onClick={resetGame}>
          {gameOver ? "Próxima Partida" : "Reiniciar"}
        </button>
        <button className="btn btn-back" onClick={backToMenu}>
          ← Trocar Modo
        </button>
      </div>
    </div>
  );
}

// ===== Função: Verificar Vencedor =====
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  return null;
}

// ===== IA: Algoritmo Minimax e Dificuldades =====
function getBestMove(squares, difficulty, aiSymbol) {
  const availableMoves = [];
  for (let i = 0; i < 9; i++) {
    if (!squares[i]) availableMoves.push(i);
  }

  if (availableMoves.length === 0) return -1;

  // Se for a primeira jogada (tabuleiro vazio), escolhemos um canto ou centro
  if (availableMoves.length === 9) {
    const firstMoves = [0, 2, 4, 6, 8];
    return firstMoves[Math.floor(Math.random() * firstMoves.length)];
  }

  // Dificuldade Fácil: 100% aleatório
  if (difficulty === "easy") {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Dificuldade Média: 50% de chance de jogar aleatório, 50% minimax
  if (difficulty === "medium") {
    if (Math.random() < 0.5) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
  }

  // Dificuldade Difícil: 15% de chance de jogar aleatório, 85% minimax
  if (difficulty === "hard") {
    if (Math.random() < 0.15) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
  }

  // Dificuldade Imbatível (ou fallback): 100% minimax
  let bestScore = -Infinity;
  let bestMove = -1;

  for (let i = 0; i < 9; i++) {
    if (!squares[i]) {
      const newSquares = squares.slice();
      newSquares[i] = aiSymbol;
      const score = minimax(newSquares, 0, false, aiSymbol);
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function minimax(squares, depth, isMaximizing, aiSymbol) {
  const humanSymbol = aiSymbol === "X" ? "O" : "X";
  const winInfo = calculateWinner(squares);
  
  // Casos terminais
  if (winInfo) {
    return winInfo.winner === aiSymbol ? 10 - depth : depth - 10;
  }
  if (!squares.includes(null)) {
    return 0; // Empate
  }

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        const newSquares = squares.slice();
        newSquares[i] = aiSymbol;
        best = Math.max(best, minimax(newSquares, depth + 1, false, aiSymbol));
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        const newSquares = squares.slice();
        newSquares[i] = humanSymbol;
        best = Math.min(best, minimax(newSquares, depth + 1, true, aiSymbol));
      }
    }
    return best;
  }
}