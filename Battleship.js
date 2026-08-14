// ===== Battleship.js =====
const BS_DIFFICULTIES = {
  easy: { gridSize: 8, label: "Fácil", description: "Tabuleiro 8×8, 4 navios", ships: [
    { name: "Encouraçado", size: 4, icon: "fa-solid fa-ship" },
    { name: "Cruzador", size: 3, icon: "fa-solid fa-anchor" },
    { name: "Submarino", size: 3, icon: "fa-solid fa-water" },
    { name: "Destroyer", size: 2, icon: "fa-solid fa-location-crosshairs" },
  ]},
  medium: { gridSize: 10, label: "Médio", description: "Tabuleiro 10×10, 5 navios", ships: [
    { name: "Porta-aviões", size: 5, icon: "fa-solid fa-jet-fighter" },
    { name: "Encouraçado", size: 4, icon: "fa-solid fa-ship" },
    { name: "Cruzador", size: 3, icon: "fa-solid fa-anchor" },
    { name: "Submarino", size: 3, icon: "fa-solid fa-water" },
    { name: "Destroyer", size: 2, icon: "fa-solid fa-location-crosshairs" },
  ]},
  hard: { gridSize: 12, label: "Difícil", description: "Tabuleiro 12×12, 7 navios", ships: [
    { name: "Porta-aviões", size: 5, icon: "fa-solid fa-jet-fighter" },
    { name: "Encouraçado", size: 4, icon: "fa-solid fa-ship" },
    { name: "Cruzador", size: 3, icon: "fa-solid fa-anchor" },
    { name: "Submarino", size: 3, icon: "fa-solid fa-water" },
    { name: "Fragata", size: 3, icon: "fa-solid fa-sailboat" },
    { name: "Destroyer", size: 2, icon: "fa-solid fa-location-crosshairs" },
    { name: "Lancha", size: 2, icon: "fa-solid fa-ferry" },
  ]},
};

function Battleship({ onBackToApp }) {
  const [difficulty, setDifficulty] = React.useState(null);

  if (!difficulty) {
    return (
      <div className="game">
        <div className="mode-select">
          <h1>Batalha Naval</h1>
          <p>Escolha a Dificuldade</p>
          <div className="mode-buttons">
            <button className="mode-btn" onClick={() => setDifficulty("easy")}>
              <span className="mode-icon" style={{ color: '#00ff73' }}><i className="fa-solid fa-circle"></i></span>
              <div className="mode-text">
                <strong>Fácil</strong>
                <span>Tabuleiro 8×8, 4 navios</span>
              </div>
            </button>
            <button className="mode-btn" onClick={() => setDifficulty("medium")}>
              <span className="mode-icon" style={{ color: '#ffcc00' }}><i className="fa-solid fa-circle"></i></span>
              <div className="mode-text">
                <strong>Médio</strong>
                <span>Tabuleiro 10×10, 5 navios</span>
              </div>
            </button>
            <button className="mode-btn" onClick={() => setDifficulty("hard")}>
              <span className="mode-icon" style={{ color: '#ff6600' }}><i className="fa-solid fa-circle"></i></span>
              <div className="mode-text">
                <strong>Difícil</strong>
                <span>Tabuleiro 12×12, 7 navios</span>
              </div>
            </button>
          </div>
          <button className="btn btn-back" style={{ marginTop: "20px" }} onClick={onBackToApp}>
            ← Menu Principal
          </button>
        </div>
      </div>
    );
  }

  return <BattleshipGame difficulty={difficulty} onBack={() => setDifficulty(null)} onBackToApp={onBackToApp} />;
}

function BattleshipGame({ difficulty, onBack, onBackToApp }) {
  const config = BS_DIFFICULTIES[difficulty];
  const gridSize = config.gridSize;
  const ships = config.ships;

  // Game phases: "placing", "playing", "won", "lost"
  const [phase, setPhase] = React.useState("placing");
  const [playerGrid, setPlayerGrid] = React.useState(() => bsCreateEmptyGrid(gridSize));
  const [enemyGrid, setEnemyGrid] = React.useState(() => bsCreateEmptyGrid(gridSize));
  const [enemyShips, setEnemyShips] = React.useState([]);
  const [playerShips, setPlayerShips] = React.useState([]);
  const [currentShipIndex, setCurrentShipIndex] = React.useState(0);
  const [isHorizontal, setIsHorizontal] = React.useState(true);
  const [hoverCells, setHoverCells] = React.useState([]);
  const [hoverValid, setHoverValid] = React.useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = React.useState(true);
  const [message, setMessage] = React.useState("Posicione seus navios no tabuleiro");
  const [playerSunkCount, setPlayerSunkCount] = React.useState(0);
  const [enemySunkCount, setEnemySunkCount] = React.useState(0);
  const [aiMemory, setAiMemory] = React.useState({ hits: [], queue: [] });
  const [lastEnemyShot, setLastEnemyShot] = React.useState(null);
  const [animatingShot, setAnimatingShot] = React.useState(false);

  // ===== Grid Helpers =====
  function bsCreateEmptyGrid(size) {
    const grid = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        row.push({ ship: null, isShot: false, isHit: false, isSunk: false });
      }
      grid.push(row);
    }
    return grid;
  }

  function deepCopyGrid(grid) {
    return grid.map(row => row.map(cell => ({ ...cell })));
  }

  // ===== Ship Placement =====
  function canPlaceShip(grid, r, c, size, horizontal) {
    for (let i = 0; i < size; i++) {
      const nr = horizontal ? r : r + i;
      const nc = horizontal ? c + i : c;
      if (nr >= gridSize || nc >= gridSize) return false;
      if (grid[nr][nc].ship !== null) return false;
    }
    return true;
  }

  function placeShipOnGrid(grid, r, c, size, horizontal, shipIndex) {
    const newGrid = deepCopyGrid(grid);
    const cells = [];
    for (let i = 0; i < size; i++) {
      const nr = horizontal ? r : r + i;
      const nc = horizontal ? c + i : c;
      newGrid[nr][nc].ship = shipIndex;
      cells.push({ r: nr, c: nc });
    }
    return { newGrid, cells };
  }

  function handlePlacementHover(r, c) {
    if (phase !== "placing" || currentShipIndex >= ships.length) return;
    const ship = ships[currentShipIndex];
    const cells = [];
    let valid = true;
    for (let i = 0; i < ship.size; i++) {
      const nr = isHorizontal ? r : r + i;
      const nc = isHorizontal ? c + i : c;
      if (nr >= gridSize || nc >= gridSize) { valid = false; break; }
      if (playerGrid[nr][nc].ship !== null) valid = false;
      cells.push({ r: nr, c: nc });
    }
    setHoverCells(cells);
    setHoverValid(valid);
  }

  function handlePlacementClick(r, c) {
    if (phase !== "placing" || currentShipIndex >= ships.length) return;
    const ship = ships[currentShipIndex];
    if (!canPlaceShip(playerGrid, r, c, ship.size, isHorizontal)) return;

    const { newGrid, cells } = placeShipOnGrid(playerGrid, r, c, ship.size, isHorizontal, currentShipIndex);
    const newShips = [...playerShips, { ...ship, cells, hits: 0, sunk: false }];
    setPlayerGrid(newGrid);
    setPlayerShips(newShips);
    setHoverCells([]);

    if (currentShipIndex + 1 >= ships.length) {
      startGame(newGrid, newShips);
    } else {
      setCurrentShipIndex(currentShipIndex + 1);
      setMessage(`Posicione: ${ships[currentShipIndex + 1].name} (${ships[currentShipIndex + 1].size} casas)`);
    }
  }

  function placeShipsRandomly(baseGrid) {
    const newGrid = deepCopyGrid(baseGrid);
    const placedShips = [];
    for (let s = 0; s < ships.length; s++) {
      const ship = ships[s];
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 1000) {
        attempts++;
        const horizontal = Math.random() < 0.5;
        const r = Math.floor(Math.random() * gridSize);
        const c = Math.floor(Math.random() * gridSize);
        if (canPlaceShip(newGrid, r, c, ship.size, horizontal)) {
          const result = placeShipOnGrid(newGrid, r, c, ship.size, horizontal, s);
          for (let ri = 0; ri < gridSize; ri++) {
            for (let ci = 0; ci < gridSize; ci++) {
              newGrid[ri][ci] = result.newGrid[ri][ci];
            }
          }
          placedShips.push({ ...ship, cells: result.cells, hits: 0, sunk: false });
          placed = true;
        }
      }
    }
    return { grid: newGrid, ships: placedShips };
  }

  function handleRandomPlacement() {
    const result = placeShipsRandomly(bsCreateEmptyGrid(gridSize));
    setPlayerGrid(result.grid);
    setPlayerShips(result.ships);
    setCurrentShipIndex(ships.length);
    startGame(result.grid, result.ships);
  }

  function startGame(pGrid, pShips) {
    const enemyResult = placeShipsRandomly(bsCreateEmptyGrid(gridSize));
    setEnemyGrid(enemyResult.grid);
    setEnemyShips(enemyResult.ships);
    setPhase("playing");
    setIsPlayerTurn(true);
    setMessage("Seu turno! Clique no campo inimigo para atacar");
    setPlayerSunkCount(0);
    setEnemySunkCount(0);
    setAiMemory({ hits: [], queue: [] });
  }

  // ===== Player Attack =====
  function handlePlayerAttack(r, c) {
    if (phase !== "playing" || !isPlayerTurn || animatingShot) return;
    if (enemyGrid[r][c].isShot) return;

    const newEnemyGrid = deepCopyGrid(enemyGrid);
    newEnemyGrid[r][c].isShot = true;
    const isHit = newEnemyGrid[r][c].ship !== null;
    newEnemyGrid[r][c].isHit = isHit;

    let newEnemyShips = enemyShips.map(s => ({ ...s }));
    let newEnemySunkCount = enemySunkCount;

    if (isHit) {
      const shipIdx = newEnemyGrid[r][c].ship;
      newEnemyShips[shipIdx].hits++;
      if (newEnemyShips[shipIdx].hits >= newEnemyShips[shipIdx].size) {
        newEnemyShips[shipIdx].sunk = true;
        newEnemySunkCount++;
        newEnemyShips[shipIdx].cells.forEach(cell => {
          newEnemyGrid[cell.r][cell.c].isSunk = true;
        });
        setMessage(<span>Você afundou o {newEnemyShips[shipIdx].name}! <i className="fa-solid fa-burst"></i></span>);
      } else {
        setMessage(<span>Acertou! <i className="fa-solid fa-bullseye"></i></span>);
      }
    } else {
      setMessage(<span>Água! <i className="fa-solid fa-water"></i></span>);
    }

    setEnemyGrid(newEnemyGrid);
    setEnemyShips(newEnemyShips);
    setEnemySunkCount(newEnemySunkCount);

    if (newEnemySunkCount >= ships.length) {
      setPhase("won");
      setMessage(<span><i className="fa-solid fa-trophy"></i> Você Venceu! Todos os navios inimigos foram afundados!</span>);
      return;
    }

    setIsPlayerTurn(false);
    setAnimatingShot(true);
    setTimeout(() => {
      executeEnemyTurn();
    }, 900);
  }

  // ===== AI Attack =====
  function executeEnemyTurn() {
    setPlayerGrid(prevPlayerGrid => {
      const newPG = deepCopyGrid(prevPlayerGrid);

      setPlayerShips(prevPS => {
        const newPS = prevPS.map(s => ({ ...s }));

        setAiMemory(prevMem => {
          const mem = { hits: [...prevMem.hits], queue: [...prevMem.queue] };

          let target = null;

          // Dificuldade Fácil: tiros puramente aleatórios, sem memória.
          // Dificuldades Médio e Difícil: usam memória de acertos (fila)
          if (difficulty !== "easy") {
            while (mem.queue.length > 0 && target === null) {
              const candidate = mem.queue.shift();
              if (candidate.r >= 0 && candidate.r < gridSize &&
                  candidate.c >= 0 && candidate.c < gridSize &&
                  !newPG[candidate.r][candidate.c].isShot) {
                target = candidate;
              }
            }
          }

          // Se não tem alvo na fila (ou é dificuldade Fácil)
          if (!target) {
            let attempts = 0;
            while (attempts < 300) {
              const r = Math.floor(Math.random() * gridSize);
              const c = Math.floor(Math.random() * gridSize);
              
              if (!newPG[r][c].isShot) {
                // Dificuldade Difícil: usa padrão xadrez para busca mais eficiente
                if (difficulty === "hard") {
                  if ((r + c) % 2 === 0) {
                    target = { r, c };
                    break;
                  }
                } else {
                  // Fácil e Médio: atira aleatoriamente
                  target = { r, c };
                  break;
                }
              }
              attempts++;
            }
            
            // Fallback (caso raro onde o padrão xadrez já está esgotado ou aleatório não encontrou)
            if (!target) {
              for (let r = 0; r < gridSize; r++) {
                for (let c = 0; c < gridSize; c++) {
                  if (!newPG[r][c].isShot) {
                    target = { r, c };
                    break;
                  }
                }
                if (target) break;
              }
            }
          }

          if (!target) {
            setIsPlayerTurn(true);
            setAnimatingShot(false);
            return prevMem;
          }

          newPG[target.r][target.c].isShot = true;
          const hit = newPG[target.r][target.c].ship !== null;
          newPG[target.r][target.c].isHit = hit;
          setLastEnemyShot({ r: target.r, c: target.c });

          if (hit) {
            const sIdx = newPG[target.r][target.c].ship;
            newPS[sIdx].hits++;
            mem.hits.push(target);

            // Add adjacent cells to queue
            [
              { r: target.r - 1, c: target.c },
              { r: target.r + 1, c: target.c },
              { r: target.r, c: target.c - 1 },
              { r: target.r, c: target.c + 1 },
            ].forEach(adj => {
              if (adj.r >= 0 && adj.r < gridSize && adj.c >= 0 && adj.c < gridSize &&
                  !newPG[adj.r][adj.c].isShot &&
                  !mem.queue.some(q => q.r === adj.r && q.c === adj.c)) {
                mem.queue.push(adj);
              }
            });

            if (newPS[sIdx].hits >= newPS[sIdx].size) {
              newPS[sIdx].sunk = true;
              newPS[sIdx].cells.forEach(cell => {
                newPG[cell.r][cell.c].isSunk = true;
              });
              const sunkSet = new Set(newPS[sIdx].cells.map(cc => `${cc.r},${cc.c}`));
              mem.hits = mem.hits.filter(h => !sunkSet.has(`${h.r},${h.c}`));
              mem.queue = mem.queue.filter(q =>
                q.r >= 0 && q.r < gridSize && q.c >= 0 && q.c < gridSize &&
                !newPG[q.r][q.c].isShot
              );

              setPlayerSunkCount(prev => {
                const newCount = prev + 1;
                if (newCount >= ships.length) {
                  setPhase("lost");
                  setMessage(<span><i className="fa-solid fa-skull"></i> Derrota! Todos os seus navios foram afundados!</span>);
                } else {
                  setIsPlayerTurn(true);
                  setMessage("O inimigo afundou seu " + newPS[sIdx].name + "! Seu turno");
                }
                return newCount;
              });
            } else {
              setIsPlayerTurn(true);
              setMessage("O inimigo acertou seu navio! Seu turno");
            }
          } else {
            setIsPlayerTurn(true);
            setMessage(<span>O inimigo errou! Seu turno <i className="fa-solid fa-bullseye"></i></span>);
          }

          setAnimatingShot(false);
          return mem;
        });

        return newPS;
      });

      return newPG;
    });
  }

  // ===== Reset Game =====
  function resetGame() {
    setPhase("placing");
    setPlayerGrid(bsCreateEmptyGrid(gridSize));
    setEnemyGrid(bsCreateEmptyGrid(gridSize));
    setPlayerShips([]);
    setEnemyShips([]);
    setCurrentShipIndex(0);
    setIsHorizontal(true);
    setHoverCells([]);
    setHoverValid(false);
    setIsPlayerTurn(true);
    setMessage("Posicione seus navios no tabuleiro");
    setPlayerSunkCount(0);
    setEnemySunkCount(0);
    setAiMemory({ hits: [], queue: [] });
    setLastEnemyShot(null);
    setAnimatingShot(false);
  }

  // ===== Rendering =====
  const allRowLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const rowLabels = allRowLabels.slice(0, gridSize);

  // Max width based on grid size
  const gameMaxWidth = gridSize <= 8 ? '780px' : gridSize <= 10 ? '920px' : '1060px';

  function renderGrid(grid, type) {
    const isEnemy = type === "enemy";
    const isPlacing = phase === "placing" && !isEnemy;

    return (
      <div className="bs-grid-wrapper">
        <div className="bs-grid-label">{isEnemy ? <span><i className="fa-solid fa-crosshairs"></i> Campo Inimigo</span> : <span><i className="fa-solid fa-anchor"></i> Seu Campo</span>}</div>
        <div className="bs-grid-container">
          <div className="bs-grid-header">
            <div className="bs-grid-corner"></div>
            {Array.from({ length: gridSize }, (_, i) => (
              <div key={i} className="bs-grid-col-label">{i + 1}</div>
            ))}
          </div>
          {grid.map((row, r) => (
            <div key={r} className="bs-grid-row">
              <div className="bs-grid-row-label">{rowLabels[r]}</div>
              {row.map((cell, c) => {
                let cellClass = "bs-cell";
                let content = null;

                if (isPlacing) {
                  if (cell.ship !== null) cellClass += " bs-cell-ship";
                  const isHovered = hoverCells.some(h => h.r === r && h.c === c);
                  if (isHovered) {
                    cellClass += hoverValid ? " bs-cell-hover-valid" : " bs-cell-hover-invalid";
                  }
                } else if (isEnemy) {
                  if (cell.isShot) {
                    if (cell.isSunk) {
                      cellClass += " bs-cell-sunk";
                      content = <i className="fa-solid fa-xmark"></i>;
                    } else if (cell.isHit) {
                      cellClass += " bs-cell-hit";
                      content = <i className="fa-solid fa-fire"></i>;
                    } else {
                      cellClass += " bs-cell-miss";
                      content = <i className="fa-solid fa-droplet"></i>;
                    }
                  } else if (phase === "playing" && isPlayerTurn && !animatingShot) {
                    cellClass += " bs-cell-target";
                  }
                } else {
                  if (cell.ship !== null) {
                    cellClass += " bs-cell-ship";
                    if (cell.isSunk) cellClass += " bs-cell-sunk";
                  }
                  if (cell.isShot) {
                    if (cell.isHit) {
                      cellClass += " bs-cell-hit";
                      content = <i className="fa-solid fa-fire"></i>;
                    } else {
                      cellClass += " bs-cell-miss";
                      content = <i className="fa-solid fa-droplet"></i>;
                    }
                  }
                  if (lastEnemyShot && lastEnemyShot.r === r && lastEnemyShot.c === c) {
                    cellClass += " bs-cell-last-shot";
                  }
                }

                return (
                  <button
                    key={c}
                    className={cellClass}
                    onClick={() => {
                      if (isPlacing && !isEnemy) handlePlacementClick(r, c);
                      else if (isEnemy && phase === "playing") handlePlayerAttack(r, c);
                    }}
                    onMouseEnter={() => {
                      if (isPlacing && !isEnemy) handlePlacementHover(r, c);
                    }}
                    onMouseLeave={() => {
                      if (isPlacing) { setHoverCells([]); setHoverValid(false); }
                    }}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderShipStatus(shipList, label) {
    if (shipList.length === 0) return null;
    return (
      <div className="bs-ship-status">
        <div className="bs-ship-status-label">{label}</div>
        <div className="bs-ship-list">
          {shipList.map((ship, i) => (
            <div key={i} className={`bs-ship-item ${ship.sunk ? "bs-ship-sunk" : ""}`}>
              <i className={ship.icon}></i>
              <span className="bs-ship-name">{ship.name}</span>
              <div className="bs-ship-health">
                {Array.from({ length: ship.size }, (_, j) => (
                  <span key={j} className={`bs-health-dot ${j < ship.hits ? "bs-health-hit" : ""}`}></span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  let statusClass = "status status-ms";
  if (phase === "won") statusClass = "status winner";
  else if (phase === "lost") statusClass = "status status-x";
  else if (!isPlayerTurn && phase === "playing") statusClass = "status status-o";

  return (
    <div className="game bs-game" style={{ maxWidth: gameMaxWidth, width: '95vw' }}>
      <div className="mode-indicator">Batalha Naval ({config.label})</div>
      <div className={statusClass}>{message}</div>

      {(phase === "playing" || phase === "won" || phase === "lost") && (
        <div className="scoreboard" style={{ marginBottom: '14px' }}>
          <div className="score-item o-score">
            <span className="score-label">Seus navios</span>
            <span className="score-value">{ships.length - playerSunkCount}/{ships.length}</span>
          </div>
          <div className="score-item x-score">
            <span className="score-label">Navios inimigos</span>
            <span className="score-value">{ships.length - enemySunkCount}/{ships.length}</span>
          </div>
        </div>
      )}

      {phase === "placing" && (
        <div className="bs-placement">
          <div className="bs-placement-info">
            {currentShipIndex < ships.length && (
              <>
                <div className="bs-current-ship">
                  <i className={ships[currentShipIndex].icon}></i>
                  <strong>{ships[currentShipIndex].name}</strong>
                  <span>({ships[currentShipIndex].size} casas)</span>
                </div>
                <button className="btn btn-back" style={{ width: 'auto', padding: '8px 16px', fontSize: '0.8rem' }}
                  onClick={() => setIsHorizontal(!isHorizontal)}>
                  <i className={`fa-solid fa-arrows-${isHorizontal ? 'left-right' : 'up-down'}`}></i>
                  {" "}{isHorizontal ? "Horizontal" : "Vertical"}
                </button>
              </>
            )}
          </div>
          {renderGrid(playerGrid, "player")}
          <div className="action-buttons" style={{ marginTop: '14px' }}>
            <button className="btn btn-next" onClick={handleRandomPlacement}>
              <i className="fa-solid fa-shuffle"></i> Posicionar Aleatoriamente
            </button>
            <button className="btn btn-back" onClick={onBack}>
              ← Trocar Dificuldade
            </button>
          </div>
        </div>
      )}

      {(phase === "playing" || phase === "won" || phase === "lost") && (
        <>
          <div className="bs-boards">
            {renderGrid(playerGrid, "player")}
            {renderGrid(enemyGrid, "enemy")}
          </div>

          <div className="bs-ship-statuses">
            {renderShipStatus(playerShips, "Seus Navios")}
            {renderShipStatus(enemyShips, "Navios Inimigos")}
          </div>

          <div className="action-buttons" style={{ marginTop: '14px' }}>
            <button className="btn btn-next" onClick={resetGame}>
              {phase === "playing" ? "Reiniciar" : "Jogar Novamente"}
            </button>
            <button className="btn btn-back" onClick={onBack}>
              ← Trocar Dificuldade
            </button>
          </div>
        </>
      )}
    </div>
  );
}
