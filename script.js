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
function Board({ xIsNext, squares, onPlay, disabled }) {
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
    status = "🏆 Vencedor: " + winInfo.winner;
    statusClass = winInfo.winner === "X" ? "winner status-x" : "winner status-o";
  } else if (!squares.includes(null)) {
    status = "🤝 Empate!";
    statusClass = "status-draw";
  } else {
    const next = xIsNext ? "X" : "O";
    status = "Vez de: " + next;
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
function Scoreboard({ score, gameMode }) {
  const labelO = gameMode === "pvc" ? "Máquina (O)" : "Jogador O";
  return (
    <div className="scoreboard">
      <div className="score-item x-score">
        <span className="score-label">Jogador X</span>
        <span className="score-value">{score.X}</span>
      </div>
      <div className="score-item draw-score">
        <span className="score-label">Empates</span>
        <span className="score-value">{score.draws}</span>
      </div>
      <div className="score-item o-score">
        <span className="score-label">{labelO}</span>
        <span className="score-value">{score.O}</span>
      </div>
    </div>
  );
}

// ===== Componente: Seleção de Modo =====
function ModeSelect({ onSelectMode }) {
  return (
    <div className="mode-select">
      <h1>Jogo da Velha</h1>
      <p>Escolha o modo de jogo</p>
      <div className="mode-buttons">
        <button className="mode-btn" onClick={() => onSelectMode("pvp")}>
          <span className="mode-icon">👥</span>
          <div className="mode-text">
            <strong>Dois Jogadores</strong>
            <span>Jogue contra um amigo no mesmo dispositivo</span>
          </div>
        </button>
        <button className="mode-btn" onClick={() => onSelectMode("pvc")}>
          <span className="mode-icon">🤖</span>
          <div className="mode-text">
            <strong>Contra a Máquina</strong>
            <span>Desafie a inteligência artificial imbatível</span>
          </div>
        </button>
      </div>
    </div>
  );
}

// ===== Componente Principal: Game =====
function Game() {
  const [gameMode, setGameMode] = React.useState(null); // null, "pvp", "pvc"
  const [squares, setSquares] = React.useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = React.useState(true);
  const [score, setScore] = React.useState({ X: 0, O: 0, draws: 0 });
  const [gameStarter, setGameStarter] = React.useState("X");
  const [gameOver, setGameOver] = React.useState(false);
  const [aiThinking, setAiThinking] = React.useState(false);

  // Efeito: IA joga quando é a vez dela
  React.useEffect(() => {
    if (gameMode !== "pvc" || xIsNext || gameOver) return;
    
    const winInfo = calculateWinner(squares);
    if (winInfo || !squares.includes(null)) return;

    setAiThinking(true);
    const timer = setTimeout(() => {
      const bestMove = getBestMove(squares);
      if (bestMove !== -1) {
        const nextSquares = squares.slice();
        nextSquares[bestMove] = "O";
        setSquares(nextSquares);
        setXIsNext(true);
      }
      setAiThinking(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [squares, xIsNext, gameMode, gameOver]);

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

  // Se modo PvC e o starter for O, a IA precisa jogar primeiro
  React.useEffect(() => {
    if (gameMode === "pvc" && !xIsNext && !gameOver && squares.every((s) => s === null)) {
      setAiThinking(true);
      const timer = setTimeout(() => {
        const nextSquares = squares.slice();
        // Primeira jogada da IA: escolher canto ou centro aleatoriamente
        const firstMoves = [0, 2, 4, 6, 8];
        const move = firstMoves[Math.floor(Math.random() * firstMoves.length)];
        nextSquares[move] = "O";
        setSquares(nextSquares);
        setXIsNext(true);
        setAiThinking(false);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [gameMode, xIsNext, gameOver, squares]);

  function selectMode(mode) {
    setGameMode(mode);
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setGameStarter("X");
    setScore({ X: 0, O: 0, draws: 0 });
    setGameOver(false);
    setAiThinking(false);
  }

  function backToMenu() {
    setGameMode(null);
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
        <ModeSelect onSelectMode={selectMode} />
      </div>
    );
  }

  const modeLabel = gameMode === "pvp" ? "Jogador vs Jogador" : "Jogador vs Máquina";
  const isDisabled = aiThinking || (gameMode === "pvc" && !xIsNext);

  return (
    <div className="game">
      <div className="mode-indicator">{modeLabel}</div>
      <Scoreboard score={score} gameMode={gameMode} />
      <Board
        xIsNext={xIsNext}
        squares={squares}
        onPlay={handlePlay}
        disabled={isDisabled}
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

// ===== IA: Algoritmo Minimax =====
function getBestMove(squares) {
  let bestScore = -Infinity;
  let bestMove = -1;

  for (let i = 0; i < 9; i++) {
    if (!squares[i]) {
      const newSquares = squares.slice();
      newSquares[i] = "O";
      const score = minimax(newSquares, 0, false);
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function minimax(squares, depth, isMaximizing) {
  const winInfo = calculateWinner(squares);
  
  // Casos terminais
  if (winInfo) {
    return winInfo.winner === "O" ? 10 - depth : depth - 10;
  }
  if (!squares.includes(null)) {
    return 0; // Empate
  }

  if (isMaximizing) {
    // IA (O) tenta maximizar
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        const newSquares = squares.slice();
        newSquares[i] = "O";
        best = Math.max(best, minimax(newSquares, depth + 1, false));
      }
    }
    return best;
  } else {
    // Jogador (X) tenta minimizar
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        const newSquares = squares.slice();
        newSquares[i] = "X";
        best = Math.min(best, minimax(newSquares, depth + 1, true));
      }
    }
    return best;
  }
}

// ===== Renderizar App =====
ReactDOM.render(<Game />, document.getElementById("root"));