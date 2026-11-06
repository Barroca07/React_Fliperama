// ===== Tetris.js =====
// Controles: ← → movem, ↓ desce mais rápido, Espaço (ou ↑) gira a peça, P pausa.
// A dificuldade define a velocidade com que as peças descem.

const TETRIS_W = 10;
const TETRIS_H = 20;

const TETRIS_DIFFICULTIES = [
  { id: "easy", label: "Fácil", desc: "Peças lentas", color: "#00ff73", icon: "fa-solid fa-leaf", speed: 800 },
  { id: "medium", label: "Médio", desc: "Velocidade normal", color: "#ffcc00", icon: "fa-solid fa-bolt", speed: 480 },
  { id: "hard", label: "Difícil", desc: "Peças muito rápidas", color: "#ff3366", icon: "fa-solid fa-fire", speed: 220 },
];

const TETROMINOES = {
  I: { color: "#00f2ff", m: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]] },
  O: { color: "#ffcc00", m: [[1, 1], [1, 1]] },
  T: { color: "#bc13fe", m: [[0, 1, 0], [1, 1, 1], [0, 0, 0]] },
  S: { color: "#00ff73", m: [[0, 1, 1], [1, 1, 0], [0, 0, 0]] },
  Z: { color: "#ff3366", m: [[1, 1, 0], [0, 1, 1], [0, 0, 0]] },
  J: { color: "#3d7bff", m: [[1, 0, 0], [1, 1, 1], [0, 0, 0]] },
  L: { color: "#ff7a00", m: [[0, 0, 1], [1, 1, 1], [0, 0, 0]] },
};

// Pontos por linhas eliminadas de uma vez (multiplicado pelo nível)
const TETRIS_LINE_POINTS = [0, 100, 300, 500, 800];

function tetrisBestKey(diff) {
  return `fliperama-tetris-best-${diff}`;
}

function readTetrisBest(diff) {
  return Number(localStorage.getItem(tetrisBestKey(diff))) || 0;
}

function tetrisEmptyBoard() {
  return Array.from({ length: TETRIS_H }, () => Array(TETRIS_W).fill(null));
}

// Gira a matriz 90° no sentido horário
function tetrisRotate(m) {
  return m[0].map((_, i) => m.map((row) => row[i]).reverse());
}

function tetrisCollides(board, m, x, y) {
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      const bx = x + c;
      const by = y + r;
      if (bx < 0 || bx >= TETRIS_W || by >= TETRIS_H) return true;
      if (by >= 0 && board[by][bx]) return true;
    }
  }
  return false;
}

// Sorteio "saco de 7": todas as peças aparecem antes de repetir
function tetrisNextFromBag(g) {
  if (g.bag.length === 0) {
    const types = Object.keys(TETROMINOES);
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    g.bag = types;
  }
  return g.bag.pop();
}

function tetrisMakePiece(type) {
  const m = TETROMINOES[type].m;
  return { type, m, x: Math.floor((TETRIS_W - m[0].length) / 2), y: type === "I" ? -1 : 0 };
}

function tetrisNewGame() {
  const g = { board: tetrisEmptyBoard(), bag: [], score: 0, lines: 0, level: 1, piece: null, next: null, flash: [] };
  g.piece = tetrisMakePiece(tetrisNextFromBag(g));
  g.next = tetrisNextFromBag(g);
  return g;
}

function tetrisGhostY(g) {
  const p = g.piece;
  let y = p.y;
  while (!tetrisCollides(g.board, p.m, p.x, y + 1)) y++;
  return y;
}

function Tetris({ onBackToApp }) {
  const [difficulty, setDifficulty] = React.useState(() => {
    const saved = localStorage.getItem("fliperama-tetris-diff");
    return TETRIS_DIFFICULTIES.some((d) => d.id === saved) ? saved : "medium";
  });
  // 'setup' | 'ready' | 'playing' | 'paused' | 'lost'
  const [status, setStatus] = React.useState("setup");
  const [, setRenderTick] = React.useState(0);
  const [best, setBest] = React.useState(0);
  const [isNewRecord, setIsNewRecord] = React.useState(false);

  const gameRef = React.useRef(null);
  const statusRef = React.useRef(status);
  const startTimeRef = React.useRef(null);
  const bestRef = React.useRef(0);
  const actionsRef = React.useRef({});

  const currentDiff = TETRIS_DIFFICULTIES.find((d) => d.id === difficulty) || TETRIS_DIFFICULTIES[1];
  const rerender = () => setRenderTick((t) => t + 1);

  function setStatusNow(next) {
    statusRef.current = next;
    setStatus(next);
  }

  function startGame() {
    localStorage.setItem("fliperama-tetris-diff", difficulty);
    gameRef.current = tetrisNewGame();
    const b = readTetrisBest(difficulty);
    bestRef.current = b;
    setBest(b);
    setIsNewRecord(false);
    startTimeRef.current = null;
    setStatusNow("ready");
  }

  function beginPlay() {
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    setStatusNow("playing");
  }

  function gameOver() {
    const g = gameRef.current;
    if (g.score > bestRef.current) {
      localStorage.setItem(tetrisBestKey(difficulty), String(g.score));
      bestRef.current = g.score;
      setBest(g.score);
      setIsNewRecord(g.score > 0);
    }
    if (startTimeRef.current) {
      recordGameResult({
        game: "tetris",
        mode: difficulty,
        result: "loss",
        durationMs: Date.now() - startTimeRef.current,
        score: g.score,
      });
      startTimeRef.current = null;
    }
    setStatusNow("lost");
  }

  // Fixa a peça no tabuleiro, limpa linhas e gera a próxima
  function lockPiece() {
    const g = gameRef.current;
    const p = g.piece;
    let overflow = false;
    p.m.forEach((row, r) =>
      row.forEach((v, c) => {
        if (!v) return;
        const by = p.y + r;
        if (by < 0) overflow = true;
        else g.board[by][p.x + c] = TETROMINOES[p.type].color;
      })
    );
    if (overflow) {
      gameOver();
      return;
    }

    // Pontua apenas quando a peça encosta/fixa (e bônus ao completar linhas)
    g.score += 10 * g.level;

    const full = [];
    g.board.forEach((row, i) => {
      if (row.every(Boolean)) full.push(i);
    });
    if (full.length) {
      g.board = g.board.filter((_, i) => !full.includes(i));
      while (g.board.length < TETRIS_H) g.board.unshift(Array(TETRIS_W).fill(null));
      g.score += TETRIS_LINE_POINTS[full.length] * g.level;
      g.lines += full.length;
      g.level = 1 + Math.floor(g.lines / 10);
    }

    g.piece = tetrisMakePiece(g.next);
    g.next = tetrisNextFromBag(g);
    if (tetrisCollides(g.board, g.piece.m, g.piece.x, g.piece.y)) {
      rerender();
      gameOver();
      return;
    }
    rerender();
  }

  function move(dx) {
    const g = gameRef.current;
    const p = g.piece;
    if (!tetrisCollides(g.board, p.m, p.x + dx, p.y)) {
      p.x += dx;
      rerender();
    }
  }

  function softDrop() {
    const g = gameRef.current;
    const p = g.piece;
    if (!tetrisCollides(g.board, p.m, p.x, p.y + 1)) {
      p.y += 1;
      rerender();
    } else {
      lockPiece();
    }
  }

  function rotate() {
    const g = gameRef.current;
    const p = g.piece;
    if (p.type === "O") return;
    const rotated = tetrisRotate(p.m);
    // Tenta pequenos deslocamentos para girar perto das paredes ("wall kick")
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!tetrisCollides(g.board, rotated, p.x + kick, p.y)) {
        p.m = rotated;
        p.x += kick;
        rerender();
        return;
      }
    }
  }

  function tick() {
    const g = gameRef.current;
    const p = g.piece;
    if (!tetrisCollides(g.board, p.m, p.x, p.y + 1)) {
      p.y += 1;
      rerender();
    } else {
      lockPiece();
    }
  }

  function togglePause() {
    if (statusRef.current === "playing") setStatusNow("paused");
    else if (statusRef.current === "paused") setStatusNow("playing");
  }

  actionsRef.current = { startGame, beginPlay, move, softDrop, rotate, togglePause };

  // Teclado (Setas + W A S D + Espaço)
  React.useEffect(() => {
    function onKeyDown(e) {
      const st = statusRef.current;
      if (st === "setup") return;
      const a = actionsRef.current;
      const k = e.key;
      const gameKeys = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " ", "w", "W", "a", "A", "s", "S", "d", "D"];
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(k)) e.preventDefault();

      if (k === "p" || k === "P") {
        a.togglePause();
        return;
      }
      if (st === "lost") {
        if ((k === " " || k === "Enter") && !e.repeat) a.startGame();
        return;
      }
      if (st === "ready") {
        if (gameKeys.includes(k) || k === "Enter") a.beginPlay();
        return;
      }
      if (st === "paused") {
        if (k === " " || k === "Enter") a.togglePause();
        return;
      }
      if (st !== "playing") return;

      if (k === "ArrowLeft" || k === "a" || k === "A") a.move(-1);
      else if (k === "ArrowRight" || k === "d" || k === "D") a.move(1);
      else if (k === "ArrowDown" || k === "s" || k === "S") a.softDrop();
      else if (k === " " || k === "ArrowUp" || k === "w" || k === "W") {
        if (!e.repeat) a.rotate();
      }
    }
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Queda automática: velocidade da dificuldade, acelerando um pouco a cada nível
  const level = gameRef.current ? gameRef.current.level : 1;
  React.useEffect(() => {
    if (status !== "playing") return;
    const interval = Math.max(70, Math.round(currentDiff.speed * Math.pow(0.88, level - 1)));
    const id = setInterval(() => {
      if (statusRef.current === "playing") tick();
    }, interval);
    return () => clearInterval(id);
  }, [status, level, currentDiff.speed]);

  const noFocus = (e) => e.preventDefault();

  // Botões na tela (toque)
  function touchAction(fn) {
    return (e) => {
      e.preventDefault();
      const st = statusRef.current;
      if (st === "ready") beginPlay();
      else if (st === "playing") fn();
    };
  }

  // ===== Tela de configuração =====
  if (status === "setup") {
    const savedBest = readTetrisBest(difficulty);
    return (
      <div className="game tetris-setup">
        <div className="setup-header">
          <span className="setup-icon" style={{ "--setup-color": "#bc13fe" }}>
            <i className="fa-solid fa-shapes"></i>
          </span>
          <h1>Tetris</h1>
          <p>Encaixe as peças e complete linhas!</p>
        </div>

        <div className="option-group">
          <div className="option-label">Velocidade das peças</div>
          <div className="option-grid">
            {TETRIS_DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                id={`tetris-diff-${d.id}`}
                className={`option-card ${difficulty === d.id ? "active" : ""}`}
                style={{ "--opt-color": d.color }}
                onClick={() => setDifficulty(d.id)}
              >
                <i className={d.icon}></i>
                <strong>{d.label}</strong>
                <span>{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="tetris-controls-help">
          <div><kbd>←</kbd><kbd>→</kbd> ou <kbd>A</kbd><kbd>D</kbd> mover</div>
          <div><kbd>↓</kbd> ou <kbd>S</kbd> descer</div>
          <div><kbd>Espaço</kbd> / <kbd>W</kbd> girar</div>
          <div><kbd>P</kbd> pausar</div>
        </div>

        <div className="best-line">
          <i className="fa-solid fa-trophy"></i>
          Seu recorde neste modo: <strong>{savedBest}</strong>
        </div>

        <div className="action-buttons">
          <button id="tetris-play-btn" className="btn btn-next btn-lg" onClick={startGame}>
            <i className="fa-solid fa-play"></i> Jogar
          </button>
          <button className="btn btn-back" onClick={onBackToApp}>
            <i className="fa-solid fa-arrow-left"></i> Menu principal
          </button>
        </div>
      </div>
    );
  }

  // ===== Tela do jogo =====
  const g = gameRef.current;
  const p = g.piece;
  const ghostY = status === "lost" ? p.y : tetrisGhostY(g);
  const pieceColor = TETROMINOES[p.type].color;

  // Monta a grade exibida: tabuleiro + sombra + peça atual
  const cells = g.board.map((row) => row.map((color) => (color ? { color, kind: "fixed" } : null)));
  p.m.forEach((row, r) =>
    row.forEach((v, c) => {
      if (!v) return;
      const x = p.x + c;
      const gy = ghostY + r;
      if (gy >= 0 && gy < TETRIS_H && !cells[gy][x]) cells[gy][x] = { color: pieceColor, kind: "ghost" };
    })
  );
  p.m.forEach((row, r) =>
    row.forEach((v, c) => {
      if (!v) return;
      const y = p.y + r;
      if (y >= 0 && y < TETRIS_H) cells[y][p.x + c] = { color: pieceColor, kind: "active" };
    })
  );

  const nextShape = TETROMINOES[g.next].m.filter((row) => row.some(Boolean));
  const canPause = status === "playing" || status === "paused";

  return (
    <div className="game tetris-game">
      <div className="game-header">
        <button className="icon-btn" title="Trocar modo" onMouseDown={noFocus} onClick={() => setStatusNow("setup")}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div className="game-header-title">
          <h2>Tetris</h2>
          <div className="game-header-tags">
            <span className="chip" style={{ "--chip-color": currentDiff.color }}>
              <i className={currentDiff.icon}></i> {currentDiff.label}
            </span>
          </div>
        </div>
        <button
          className="icon-btn"
          title={status === "paused" ? "Continuar (P)" : "Pausar (P)"}
          onMouseDown={noFocus}
          onClick={togglePause}
          disabled={!canPause}
        >
          <i className={`fa-solid ${status === "paused" ? "fa-play" : "fa-pause"}`}></i>
        </button>
      </div>

      <div className="tetris-layout">
        <div className="tetris-board-wrap">
          <div className="tetris-board">
            {cells.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`tetris-cell ${cell ? `tetris-${cell.kind}` : ""}`}
                  style={cell ? { "--cell-color": cell.color } : undefined}
                />
              ))
            )}
          </div>

          {status === "ready" && (
            <div className="board-overlay">
              <div className="board-overlay-card">
                <div className="board-overlay-icon"><i className="fa-solid fa-gamepad"></i></div>
                <h3>Pronto?</h3>
                <p>Aperte uma seta ou <kbd>Espaço</kbd> para começar</p>
                <div className="board-overlay-actions">
                  <button className="btn btn-next" onMouseDown={noFocus} onClick={beginPlay}>
                    <i className="fa-solid fa-play"></i> Começar
                  </button>
                </div>
              </div>
            </div>
          )}

          {status === "paused" && (
            <div className="board-overlay">
              <div className="board-overlay-card">
                <div className="board-overlay-icon"><i className="fa-solid fa-pause"></i></div>
                <h3>Pausado</h3>
                <p>Aperte <kbd>P</kbd> para continuar</p>
                <div className="board-overlay-actions">
                  <button className="btn btn-next" onMouseDown={noFocus} onClick={togglePause}>
                    <i className="fa-solid fa-play"></i> Continuar
                  </button>
                </div>
              </div>
            </div>
          )}

          {status === "lost" && (
            <div className="board-overlay">
              <div className="board-overlay-card">
                <div className="board-overlay-icon danger"><i className="fa-solid fa-skull-crossbones"></i></div>
                <h3>Fim de jogo</h3>
                <div className="board-overlay-score">{g.score}</div>
                {isNewRecord ? (
                  <span className="record-badge"><i className="fa-solid fa-crown"></i> Novo recorde!</span>
                ) : (
                  <p>Recorde: {best}</p>
                )}
                <div className="board-overlay-actions">
                  <button id="tetris-retry-btn" className="btn btn-next" onMouseDown={noFocus} onClick={startGame}>
                    <i className="fa-solid fa-rotate-right"></i> Jogar de novo
                  </button>
                  <button className="btn btn-back" onMouseDown={noFocus} onClick={() => setStatusNow("setup")}>
                    <i className="fa-solid fa-sliders"></i> Trocar modo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="tetris-side">
          <div className="tetris-panel">
            <span className="stat-label">Próxima</span>
            <div className="tetris-next" style={{ gridTemplateColumns: `repeat(${nextShape[0].length}, 1fr)` }}>
              {nextShape.map((row, r) =>
                row.map((v, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={`tetris-next-cell ${v ? "filled" : ""}`}
                    style={v ? { "--cell-color": TETROMINOES[g.next].color } : undefined}
                  />
                ))
              )}
            </div>
          </div>
          <div className="tetris-panel">
            <span className="stat-label">Pontos</span>
            <span className="stat-value stat-accent">{g.score}</span>
          </div>
          <div className="tetris-panel">
            <span className="stat-label"><i className="fa-solid fa-trophy"></i> Recorde</span>
            <span className="stat-value stat-gold">{Math.max(best, g.score)}</span>
          </div>
          <div className="tetris-panel tetris-panel-row">
            <div>
              <span className="stat-label">Linhas</span>
              <span className="stat-value">{g.lines}</span>
            </div>
            <div>
              <span className="stat-label">Nível</span>
              <span className="stat-value">{g.level}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Controles na tela (aparecem em dispositivos de toque) */}
      <div className="tetris-touch">
        <button className="dpad-btn" aria-label="Esquerda" onMouseDown={noFocus} onClick={touchAction(() => move(-1))}>
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <button className="dpad-btn" aria-label="Girar" onMouseDown={noFocus} onClick={touchAction(rotate)}>
          <i className="fa-solid fa-rotate-right"></i>
        </button>
        <button className="dpad-btn" aria-label="Descer" onMouseDown={noFocus} onClick={touchAction(softDrop)}>
          <i className="fa-solid fa-chevron-down"></i>
        </button>
        <button className="dpad-btn" aria-label="Direita" onMouseDown={noFocus} onClick={touchAction(() => move(1))}>
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      <p className="snake-hint">
        <kbd>←</kbd><kbd>→</kbd> / <kbd>A</kbd><kbd>D</kbd> mover
        <span className="snake-hint-sep">•</span>
        <kbd>↓</kbd> / <kbd>S</kbd> descer
        <span className="snake-hint-sep">•</span>
        <kbd>Espaço</kbd> / <kbd>W</kbd> girar
        <span className="snake-hint-sep">•</span>
        <kbd>P</kbd> pausar
      </p>
    </div>
  );
}

