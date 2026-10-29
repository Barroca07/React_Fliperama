// ===== Snake.js =====
const SNAKE_DIFFICULTIES = [
  { id: "easy", label: "Fácil", desc: "Velocidade constante", color: "#00ff73", icon: "fa-solid fa-leaf", initialSpeed: 170, speedIncrease: false },
  { id: "medium", label: "Médio", desc: "Acelera aos poucos", color: "#ffcc00", icon: "fa-solid fa-bolt", initialSpeed: 150, speedIncrease: true },
  { id: "hard", label: "Difícil", desc: "Aceleração agressiva", color: "#ff3366", icon: "fa-solid fa-fire", initialSpeed: 120, speedIncrease: true },
];

const SNAKE_SIZES = [
  { id: 10, label: "Pequena", desc: "10 × 10", color: "#00f2ff", icon: "fa-solid fa-compress" },
  { id: 14, label: "Média", desc: "14 × 14", color: "#bc13fe", icon: "fa-solid fa-square" },
  { id: 18, label: "Grande", desc: "18 × 18", color: "#ff66aa", icon: "fa-solid fa-expand" },
];

const SNAKE_HEAD_ROTATION = { "0,-1": 0, "1,0": 90, "0,1": 180, "-1,0": 270 };

function snakeBestKey(difficulty, size) {
  return `fliperama-snake-best-${difficulty}-${size}`;
}

function readSnakeBest(difficulty, size) {
  return Number(localStorage.getItem(snakeBestKey(difficulty, size))) || 0;
}

function Snake({ onBackToApp }) {
  const [difficulty, setDifficulty] = React.useState(() => {
    const saved = localStorage.getItem("fliperama-snake-diff");
    return SNAKE_DIFFICULTIES.some(d => d.id === saved) ? saved : "medium";
  });
  const [size, setSize] = React.useState(() => {
    const saved = Number(localStorage.getItem("fliperama-snake-size"));
    return SNAKE_SIZES.some(s => s.id === saved) ? saved : 14;
  });
  // 'setup' | 'ready' | 'playing' | 'paused' | 'lost'
  const [status, setStatus] = React.useState("setup");

  const [snake, setSnake] = React.useState([]);
  const [dir, setDir] = React.useState({ x: 0, y: -1 });
  const [apple, setApple] = React.useState({ x: 0, y: 0 });
  const [score, setScore] = React.useState(0);
  const [best, setBest] = React.useState(0);
  const [isNewRecord, setIsNewRecord] = React.useState(false);
  const [touchStart, setTouchStart] = React.useState(null);

  const currentDiff = SNAKE_DIFFICULTIES.find(d => d.id === difficulty) || SNAKE_DIFFICULTIES[1];

  const snakeRef = React.useRef(snake);
  const dirRef = React.useRef(dir);
  const appleRef = React.useRef(apple);
  const statusRef = React.useRef(status);
  const diffRef = React.useRef(currentDiff);
  const sizeRef = React.useRef(size);
  // Fila de direções: armazena até 2 direções pendentes para evitar inversão com teclas rápidas
  const dirQueueRef = React.useRef([]);
  const startTimeRef = React.useRef(null);
  const startGameRef = React.useRef(null);

  // Ao terminar: atualiza recorde local e envia a pontuação para o ranking
  React.useEffect(() => {
    if (status !== "lost") return;
    if (score > best) {
      localStorage.setItem(snakeBestKey(difficulty, size), String(score));
      setBest(score);
      setIsNewRecord(score > 0);
    }
    if (!startTimeRef.current) return;
    recordGameResult({
      game: "snake",
      mode: `${difficulty}-${size}`,
      result: "loss",
      durationMs: Date.now() - startTimeRef.current,
      score,
    });
    startTimeRef.current = null;
  }, [status]);

  React.useEffect(() => {
    snakeRef.current = snake;
    appleRef.current = apple;
    statusRef.current = status;
    diffRef.current = currentDiff;
    sizeRef.current = size;
  }, [snake, apple, status, currentDiff, size]);

  // Mantém dirRef sincronizado separadamente para não depender do render
  React.useEffect(() => {
    dirRef.current = dir;
  }, [dir]);

  function spawnApple(currentSnake, boardSize) {
    let newApple;
    while (true) {
      newApple = {
        x: Math.floor(Math.random() * boardSize),
        y: Math.floor(Math.random() * boardSize),
      };
      if (!currentSnake.some(s => s.x === newApple.x && s.y === newApple.y)) {
        break;
      }
    }
    return newApple;
  }

  // Prepara o tabuleiro e aguarda o jogador apertar uma direção
  function startGame() {
    localStorage.setItem("fliperama-snake-diff", difficulty);
    localStorage.setItem("fliperama-snake-size", String(size));
    const center = Math.floor(size / 2);
    const initial = [{ x: center, y: center }];
    setSnake(initial);
    setDir({ x: 0, y: -1 });
    dirRef.current = { x: 0, y: -1 };
    dirQueueRef.current = [];
    setScore(0);
    setIsNewRecord(false);
    setBest(readSnakeBest(difficulty, size));
    setApple(spawnApple(initial, size));
    startTimeRef.current = null;
    setStatus("ready");
  }
  startGameRef.current = startGame;

  function setStatusNow(next) {
    statusRef.current = next;
    setStatus(next);
  }

  // Começa a partida de fato (primeira direção escolhida)
  function beginPlay(newDir) {
    if (newDir) {
      dirRef.current = newDir;
      setDir(newDir);
    }
    dirQueueRef.current = [];
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    setStatusNow("playing");
  }

  function togglePause() {
    if (statusRef.current === "playing") setStatusNow("paused");
    else if (statusRef.current === "paused") setStatusNow("playing");
  }

  // Valida se a nova direção não é oposta à direção de referência
  function isOpposite(newDir, refDir) {
    return (newDir.x !== 0 && newDir.x === -refDir.x) ||
           (newDir.y !== 0 && newDir.y === -refDir.y);
  }

  function queueDir(newDir) {
    // Valida contra a última direção na fila, ou a direção atual se a fila estiver vazia
    const queue = dirQueueRef.current;
    const lastDir = queue.length > 0 ? queue[queue.length - 1] : dirRef.current;
    if (!isOpposite(newDir, lastDir) && (newDir.x !== lastDir.x || newDir.y !== lastDir.y)) {
      // Limita a fila a 2 entradas para evitar acúmulo excessivo
      if (queue.length < 2) {
        dirQueueRef.current = [...queue, newDir];
      }
    }
  }

  // Entrada de direção unificada (teclado, toque e D-pad)
  function handleDirInput(newDir) {
    const st = statusRef.current;
    if (st === "ready") beginPlay(newDir);
    else if (st === "playing") queueDir(newDir);
    else if (st === "paused") { queueDir(newDir); setStatusNow("playing"); }
  }

  React.useEffect(() => {
    function handleKeyDown(e) {
      const st = statusRef.current;
      if (st === "setup") return;

      const key = e.key;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].indexOf(key) > -1) {
        e.preventDefault();
      }

      if (key === " " || key === "p" || key === "P" || key === "Enter") {
        if (st === "lost" && key !== "p" && key !== "P") startGameRef.current();
        else if (st === "ready") beginPlay(null);
        else togglePause();
        return;
      }

      let newDir = null;
      if (key === "ArrowUp" || key === "w" || key === "W") newDir = { x: 0, y: -1 };
      if (key === "ArrowDown" || key === "s" || key === "S") newDir = { x: 0, y: 1 };
      if (key === "ArrowLeft" || key === "a" || key === "A") newDir = { x: -1, y: 0 };
      if (key === "ArrowRight" || key === "d" || key === "D") newDir = { x: 1, y: 0 };

      if (newDir) handleDirInput(newDir);
    }

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (status !== "playing") return;

    let speed = diffRef.current.initialSpeed;
    if (diffRef.current.speedIncrease) {
      speed = Math.max(60, speed - score * 3);
    }

    const interval = setInterval(() => {
      const currentSnake = snakeRef.current;
      const currentApple = appleRef.current;
      const currentSize = sizeRef.current;

      // Consome a próxima direção da fila, se houver
      let currentDir = dirRef.current;
      if (dirQueueRef.current.length > 0) {
        currentDir = dirQueueRef.current.shift();
        dirRef.current = currentDir;
        setDir(currentDir);
      }

      const head = currentSnake[0];
      const newHead = { x: head.x + currentDir.x, y: head.y + currentDir.y };

      // Parede
      if (newHead.x < 0 || newHead.x >= currentSize || newHead.y < 0 || newHead.y >= currentSize) {
        setStatusNow("lost");
        return;
      }

      // Corpo
      if (currentSnake.some(s => s.x === newHead.x && s.y === newHead.y)) {
        setStatusNow("lost");
        return;
      }

      const newSnake = [newHead, ...currentSnake];

      // Comeu maçã
      if (newHead.x === currentApple.x && newHead.y === currentApple.y) {
        setScore(s => s + 10);
        const nextApple = spawnApple(newSnake, currentSize);
        appleRef.current = nextApple;
        setApple(nextApple);
      } else {
        newSnake.pop();
      }

      snakeRef.current = newSnake;
      setSnake(newSnake);

    }, speed);

    return () => clearInterval(interval);
  }, [status, score]);

  function handleTouchStart(e) {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  }

  function handleTouchMove(e) {
    if (!touchStart) return;
    const st = statusRef.current;
    if (st !== "playing" && st !== "ready" && st !== "paused") return;

    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;

    const dx = touchEndX - touchStart.x;
    const dy = touchEndY - touchStart.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) {
        handleDirInput({ x: dx > 0 ? 1 : -1, y: 0 });
        setTouchStart({ x: touchEndX, y: touchEndY });
      }
    } else {
      if (Math.abs(dy) > 30) {
        handleDirInput({ x: 0, y: dy > 0 ? 1 : -1 });
        setTouchStart({ x: touchEndX, y: touchEndY });
      }
    }
  }

  function handleTouchEnd() {
    setTouchStart(null);
  }

  // Impede que botões fiquem com foco (Espaço/Enter não devem "clicar" neles)
  const noFocus = (e) => e.preventDefault();

  // ===== Tela de configuração (dificuldade + tamanho numa só tela) =====
  if (status === "setup") {
    const savedBest = readSnakeBest(difficulty, size);
    return (
      <div className="game snake-setup">
        <div className="setup-header">
          <span className="setup-icon" style={{ '--setup-color': '#00ff73' }}>
            <i className="fa-solid fa-staff-snake"></i>
          </span>
          <h1>Cobrinha</h1>
          <p>Coma as maçãs, cresça e não bata em nada!</p>
        </div>

        <div className="option-group">
          <div className="option-label">Dificuldade</div>
          <div className="option-grid">
            {SNAKE_DIFFICULTIES.map(d => (
              <button
                key={d.id}
                id={`snake-diff-${d.id}`}
                className={`option-card ${difficulty === d.id ? "active" : ""}`}
                style={{ '--opt-color': d.color }}
                onClick={() => setDifficulty(d.id)}
              >
                <i className={d.icon}></i>
                <strong>{d.label}</strong>
                <span>{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <div className="option-label">Tamanho da arena</div>
          <div className="option-grid">
            {SNAKE_SIZES.map(s => (
              <button
                key={s.id}
                id={`snake-size-${s.id}`}
                className={`option-card ${size === s.id ? "active" : ""}`}
                style={{ '--opt-color': s.color }}
                onClick={() => setSize(s.id)}
              >
                <i className={s.icon}></i>
                <strong>{s.label}</strong>
                <span>{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="best-line">
          <i className="fa-solid fa-trophy"></i>
          Seu recorde neste modo: <strong>{savedBest}</strong>
        </div>

        <div className="action-buttons">
          <button id="snake-play-btn" className="btn btn-next btn-lg" onClick={startGame}>
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
  const bodyIndex = new Map();
  snake.forEach((s, i) => bodyIndex.set(`${s.x},${s.y}`, i));
  const len = snake.length;
  const headRotation = SNAKE_HEAD_ROTATION[`${dir.x},${dir.y}`] || 0;
  const sizeInfo = SNAKE_SIZES.find(s => s.id === size);
  const canPause = status === "playing" || status === "paused";

  return (
    <div
      className="game snake-game"
      style={{ touchAction: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="game-header">
        <button
          className="icon-btn"
          title="Trocar modo"
          onMouseDown={noFocus}
          onClick={() => setStatusNow("setup")}
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div className="game-header-title">
          <h2>Cobrinha</h2>
          <div className="game-header-tags">
            <span className="chip" style={{ '--chip-color': currentDiff.color }}>
              <i className={currentDiff.icon}></i> {currentDiff.label}
            </span>
            <span className="chip" style={{ '--chip-color': sizeInfo ? sizeInfo.color : undefined }}>
              <i className="fa-solid fa-border-all"></i> {size}×{size}
            </span>
          </div>
        </div>
        <button
          className="icon-btn"
          title={status === "paused" ? "Continuar (Espaço)" : "Pausar (Espaço)"}
          onMouseDown={noFocus}
          onClick={togglePause}
          disabled={!canPause}
        >
          <i className={`fa-solid ${status === "paused" ? "fa-play" : "fa-pause"}`}></i>
        </button>
      </div>

      <div className="stat-row">
        <div className="stat">
          <span className="stat-label">Pontos</span>
          <span className="stat-value stat-accent">{score}</span>
        </div>
        <div className="stat">
          <span className="stat-label"><i className="fa-solid fa-trophy"></i> Recorde</span>
          <span className="stat-value stat-gold">{Math.max(best, score)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Tamanho</span>
          <span className="stat-value">{len}</span>
        </div>
      </div>

      <div className="snake-board-wrap">
        <div className="snake-board" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
          {Array.from({ length: size * size }).map((_, i) => {
            const x = i % size;
            const y = Math.floor(i / size);
            const idx = bodyIndex.get(`${x},${y}`);
            const isHead = idx === 0;
            const isSnake = idx !== undefined;
            const isApple = apple.x === x && apple.y === y;

            let classes = "snake-cell";
            let style;
            if (isHead) {
              classes += " snake-head";
              if (status === "lost") classes += " snake-dead";
              style = { transform: `rotate(${headRotation}deg)` };
            } else if (isSnake) {
              classes += " snake-body";
              // Cauda vai ficando mais suave
              style = { opacity: 1 - (idx / Math.max(len, 1)) * 0.55 };
            } else if (isApple) {
              classes += " snake-apple";
            }

            return <div key={i} className={classes} style={style}></div>;
          })}
        </div>

        {status === "ready" && (
          <div className="board-overlay">
            <div className="board-overlay-card">
              <div className="board-overlay-icon"><i className="fa-solid fa-gamepad"></i></div>
              <h3>Pronto?</h3>
              <p>Aperte uma seta, <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> ou deslize para começar</p>
              <div className="board-overlay-actions">
                <button className="btn btn-next" onMouseDown={noFocus} onClick={() => beginPlay(null)}>
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
              <p>Aperte <kbd>Espaço</kbd> para continuar</p>
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
              <div className="board-overlay-score">{score}</div>
              {isNewRecord ? (
                <span className="record-badge"><i className="fa-solid fa-crown"></i> Novo recorde!</span>
              ) : (
                <p>Recorde: {best}</p>
              )}
              <div className="board-overlay-actions">
                <button id="snake-retry-btn" className="btn btn-next" onMouseDown={noFocus} onClick={startGame}>
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

      {/* Controles na tela (aparecem em dispositivos de toque) */}
      <div className="snake-dpad">
        <button className="dpad-btn dpad-up" aria-label="Cima" onMouseDown={noFocus} onClick={() => handleDirInput({ x: 0, y: -1 })}>
          <i className="fa-solid fa-chevron-up"></i>
        </button>
        <button className="dpad-btn dpad-left" aria-label="Esquerda" onMouseDown={noFocus} onClick={() => handleDirInput({ x: -1, y: 0 })}>
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <button className="dpad-btn dpad-right" aria-label="Direita" onMouseDown={noFocus} onClick={() => handleDirInput({ x: 1, y: 0 })}>
          <i className="fa-solid fa-chevron-right"></i>
        </button>
        <button className="dpad-btn dpad-down" aria-label="Baixo" onMouseDown={noFocus} onClick={() => handleDirInput({ x: 0, y: 1 })}>
          <i className="fa-solid fa-chevron-down"></i>
        </button>
      </div>

      <p className="snake-hint">
        <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> mover
        <span className="snake-hint-sep">•</span>
        <kbd>Espaço</kbd> pausar
      </p>
    </div>
  );
}
