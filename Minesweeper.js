// ===== Minesweeper.js =====
const MS_DIFFICULTIES = {
  easy: { rows: 9, cols: 9, mines: 10, label: "Fácil" },
  medium: { rows: 16, cols: 16, mines: 40, label: "Médio" },
};

function Minesweeper({ onBackToApp }) {
  const [difficulty, setDifficulty] = React.useState(null);
  
  if (!difficulty) {
    return (
      <div className="game">
        <div className="mode-select">
          <h1>Campo Minado</h1>
          <p>Escolha a Dificuldade</p>
          <div className="mode-buttons">
            <button className="mode-btn" onClick={() => setDifficulty("easy")}>
              <span className="mode-icon" style={{color: '#00ff73'}}><i className="fa-solid fa-circle"></i></span>
              <div className="mode-text">
                <strong>Fácil</strong>
                <span>Tabuleiro 9x9, 10 Minas</span>
              </div>
            </button>
            <button className="mode-btn" onClick={() => setDifficulty("medium")}>
              <span className="mode-icon" style={{color: '#ffcc00'}}><i className="fa-solid fa-circle"></i></span>
              <div className="mode-text">
                <strong>Médio</strong>
                <span>Tabuleiro 16x16, 40 Minas</span>
              </div>
            </button>
          </div>
          <button className="btn btn-back" style={{marginTop: "20px"}} onClick={onBackToApp}>
            ← Menu Principal
          </button>
        </div>
      </div>
    );
  }
  
  return <MinesweeperGame difficulty={difficulty} onBack={() => setDifficulty(null)} />;
}

function MinesweeperGame({ difficulty, onBack }) {
  const config = MS_DIFFICULTIES[difficulty];
  const [grid, setGrid] = React.useState([]);
  const [status, setStatus] = React.useState("playing"); // playing, won, lost
  const [flagsPlaced, setFlagsPlaced] = React.useState(0);
  const [isFirstClick, setIsFirstClick] = React.useState(true);

  React.useEffect(() => {
    initGame();
  }, [difficulty]);

  function initGame() {
    // Gerar tabuleiro vazio
    let initialGrid = [];
    for (let r = 0; r < config.rows; r++) {
      let row = [];
      for (let c = 0; c < config.cols; c++) {
        row.push({
          r, c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0
        });
      }
      initialGrid.push(row);
    }
    setGrid(initialGrid);
    setStatus("playing");
    setFlagsPlaced(0);
    setIsFirstClick(true);
  }

  function placeMines(firstR, firstC, currentGrid) {
    let minesPlaced = 0;
    while (minesPlaced < config.mines) {
      let r = Math.floor(Math.random() * config.rows);
      let c = Math.floor(Math.random() * config.cols);
      // Evita colocar mina no primeiro clique (para não perder de cara)
      if (!currentGrid[r][c].isMine && (r !== firstR || c !== firstC)) {
        currentGrid[r][c].isMine = true;
        minesPlaced++;
      }
    }

    // Calcular minas adjacentes para cada célula vazia
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (!currentGrid[r][c].isMine) {
          let count = 0;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              let nr = r + i, nc = c + j;
              if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
                if (currentGrid[nr][nc].isMine) count++;
              }
            }
          }
          currentGrid[r][c].adjacentMines = count;
        }
      }
    }
  }

  function handleCellClick(r, c) {
    if (status !== "playing") return;
    let newGrid = [...grid.map(row => [...row])];
    
    if (newGrid[r][c].isRevealed || newGrid[r][c].isFlagged) return;

    if (isFirstClick) {
      placeMines(r, c, newGrid);
      setIsFirstClick(false);
    }

    if (newGrid[r][c].isMine) {
      // Fim de Jogo: revelou uma mina
      revealAllMines(newGrid);
      newGrid[r][c].exploded = true;
      setGrid(newGrid);
      setStatus("lost");
      return;
    }

    floodFill(newGrid, r, c);
    setGrid(newGrid);
    checkWin(newGrid);
  }

  function handleCellRightClick(e, r, c) {
    e.preventDefault();
    if (status !== "playing") return;
    
    let newGrid = [...grid.map(row => [...row])];
    if (newGrid[r][c].isRevealed) return;

    if (!newGrid[r][c].isFlagged && flagsPlaced >= config.mines) return;

    newGrid[r][c].isFlagged = !newGrid[r][c].isFlagged;
    setFlagsPlaced(prev => newGrid[r][c].isFlagged ? prev + 1 : prev - 1);
    setGrid(newGrid);
  }

  function floodFill(grid, r, c) {
    if (r < 0 || r >= config.rows || c < 0 || c >= config.cols) return;
    if (grid[r][c].isRevealed || grid[r][c].isFlagged) return;

    grid[r][c].isRevealed = true;

    if (grid[r][c].adjacentMines === 0) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          floodFill(grid, r + i, c + j);
        }
      }
    }
  }

  function revealAllMines(grid) {
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (grid[r][c].isMine) {
          grid[r][c].isRevealed = true;
        }
      }
    }
  }

  function checkWin(grid) {
    let revealedCount = 0;
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (grid[r][c].isRevealed && !grid[r][c].isMine) {
          revealedCount++;
        }
      }
    }
    if (revealedCount === config.rows * config.cols - config.mines) {
      setStatus("won");
      // Marcar com bandeira as minas restantes
      let newGrid = [...grid];
      for (let r = 0; r < config.rows; r++) {
        for (let c = 0; c < config.cols; c++) {
          if (newGrid[r][c].isMine && !newGrid[r][c].isFlagged) {
             newGrid[r][c].isFlagged = true;
          }
        }
      }
      setGrid(newGrid);
      setFlagsPlaced(config.mines);
    }
  }

  let statusMsg = <span><i className="fa-solid fa-flag"></i> Bandeiras: {flagsPlaced} / {config.mines}</span>;
  let statusClass = "status-ms";
  if (status === "won") {
    statusMsg = <span><i className="fa-solid fa-trophy"></i> Você Venceu!</span>;
    statusClass = "winner status-x";
  } else if (status === "lost") {
    statusMsg = <span><i className="fa-solid fa-burst"></i> Fim de Jogo</span>;
    statusClass = "status-x"; // vermelho
  }

  return (
    <div className="game" style={{ maxWidth: difficulty === "medium" ? '600px' : '420px', width: '95vw' }}>
      <div className="mode-indicator">Campo Minado ({config.label})</div>
      <div className={`status ${statusClass}`}>{statusMsg}</div>
      
      <div className="ms-board" style={{ gridTemplateColumns: `repeat(${config.cols}, 1fr)` }} onContextMenu={(e) => e.preventDefault()}>
        {grid.map((row, r) => 
          row.map((cell, c) => (
            <MinesweeperCell 
              key={`${r}-${c}`}
              cell={cell}
              onClick={() => handleCellClick(r, c)}
              onRightClick={(e) => handleCellRightClick(e, r, c)}
            />
          ))
        )}
      </div>

      <div className="action-buttons">
        <button className="btn btn-next" onClick={initGame}>
          {status !== "playing" ? "Jogar Novamente" : "Reiniciar"}
        </button>
        <button className="btn btn-back" onClick={onBack}>
          ← Trocar Dificuldade
        </button>
      </div>
    </div>
  );
}

function MinesweeperCell({ cell, onClick, onRightClick }) {
  let content = null;
  if (cell.isRevealed) {
    if (cell.isMine) {
      content = cell.exploded ? <i className="fa-solid fa-burst"></i> : <i className="fa-solid fa-bomb"></i>;
    } else if (cell.adjacentMines > 0) {
      content = cell.adjacentMines;
    }
  } else if (cell.isFlagged) {
    content = <i className="fa-solid fa-flag" style={{color: '#ff0055'}}></i>;
  }

  const colors = ["", "#00f2ff", "#00ff73", "#ff0055", "#bc13fe", "#ffcc00", "#00f2ff", "#fff", "#fff"];
  let style = {};
  if (cell.isRevealed && !cell.isMine && cell.adjacentMines > 0) {
    style.color = colors[cell.adjacentMines];
    style.textShadow = `0 0 8px ${style.color}`;
  }

  let classNames = "ms-cell";
  if (cell.isRevealed) classNames += " revealed";
  if (cell.exploded) classNames += " exploded";

  return (
    <button 
      className={classNames}
      style={style}
      onClick={onClick}
      onContextMenu={onRightClick}
      onMouseDown={(e) => e.preventDefault()} // impede a seleção de texto ao clicar
    >
      {content}
    </button>
  );
}
