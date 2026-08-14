// ===== Snake.js =====
function Snake({ onBackToApp }) {
  const [difficulty, setDifficulty] = React.useState("medium");
  const [size, setSize] = React.useState(14);
  const [status, setStatus] = React.useState("menu_difficulty"); // 'menu_difficulty', 'menu_size', 'playing', 'lost'
  
  const [snake, setSnake] = React.useState([]);
  const [dir, setDir] = React.useState({ x: 0, y: -1 });
  const [apple, setApple] = React.useState({ x: 0, y: 0 });
  const [score, setScore] = React.useState(0);
  const [touchStart, setTouchStart] = React.useState(null);

  const diffConfigs = {
    easy: { initialSpeed: 170, speedIncrease: false, label: "Fácil" },
    medium: { initialSpeed: 150, speedIncrease: true, label: "Médio" },
    hard: { initialSpeed: 120, speedIncrease: true, label: "Difícil" }
  };

  const currentDiff = diffConfigs[difficulty] || diffConfigs.easy;

  const snakeRef = React.useRef(snake);
  const dirRef = React.useRef(dir);
  const appleRef = React.useRef(apple);
  const statusRef = React.useRef(status);
  const diffRef = React.useRef(currentDiff);
  const sizeRef = React.useRef(size);
  // Fila de direções: armazena até 2 direções pendentes para evitar inversão com teclas rápidas
  const dirQueueRef = React.useRef([]);

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

  function startGame(selectedDiff, selectedSize) {
    const center = Math.floor(selectedSize / 2);
    setSnake([{ x: center, y: center }]);
    setDir({ x: 0, y: -1 });
    dirRef.current = { x: 0, y: -1 };
    dirQueueRef.current = [];
    setScore(0);
    setStatus("playing");
    setApple(spawnApple([{ x: center, y: center }], selectedSize));
  }

  // Valida se a nova direção não é oposta à direção de referência
  function isOpposite(newDir, refDir) {
    return (newDir.x !== 0 && newDir.x === -refDir.x) ||
           (newDir.y !== 0 && newDir.y === -refDir.y);
  }

  React.useEffect(() => {
    function handleKeyDown(e) {
      if (statusRef.current !== "playing") return;
      
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
          e.preventDefault();
      }
      
      const key = e.key;
      
      let newDir = null;
      if (key === "ArrowUp" || key === "w" || key === "W") newDir = { x: 0, y: -1 };
      if (key === "ArrowDown" || key === "s" || key === "S") newDir = { x: 0, y: 1 };
      if (key === "ArrowLeft" || key === "a" || key === "A") newDir = { x: -1, y: 0 };
      if (key === "ArrowRight" || key === "d" || key === "D") newDir = { x: 1, y: 0 };

      if (newDir) {
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
        setStatus("lost");
        return;
      }

      // Corpo
      if (currentSnake.some(s => s.x === newHead.x && s.y === newHead.y)) {
        setStatus("lost");
        return;
      }

      const newSnake = [newHead, ...currentSnake];

      // Comeu maçã
      if (newHead.x === currentApple.x && newHead.y === currentApple.y) {
        setScore(s => s + 10);
        setApple(spawnApple(newSnake, currentSize));
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);

    }, speed);

    return () => clearInterval(interval);
  }, [status, score]);

  function handleTouchStart(e) {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  }

  function handleTouchMove(e) {
    if (!touchStart || status !== "playing") return;
    e.preventDefault();

    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    
    const dx = touchEndX - touchStart.x;
    const dy = touchEndY - touchStart.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) {
        changeDir(dx > 0 ? 1 : -1, 0);
        setTouchStart({ x: touchEndX, y: touchEndY });
      }
    } else {
      if (Math.abs(dy) > 30) {
        changeDir(0, dy > 0 ? 1 : -1);
        setTouchStart({ x: touchEndX, y: touchEndY });
      }
    }
  }
  
  function handleTouchEnd() {
    setTouchStart(null);
  }

  function changeDir(x, y) {
    const queue = dirQueueRef.current;
    const lastDir = queue.length > 0 ? queue[queue.length - 1] : dirRef.current;
    let newDir = { x, y };
    if (!isOpposite(newDir, lastDir) && (newDir.x !== lastDir.x || newDir.y !== lastDir.y)) {
      if (queue.length < 2) {
        dirQueueRef.current = [...queue, newDir];
      }
    }
  }

  if (status === "menu_difficulty") {
    return (
      <div className="game">
        <div className="mode-select">
          <h1>Cobrinha</h1>
          <p>Escolha a Dificuldade</p>
          <div className="mode-buttons">
            <button className="mode-btn" onClick={() => { setDifficulty("easy"); setStatus("menu_size"); }}>
              <span className="mode-icon" style={{color: '#00ff73'}}><i className="fa-solid fa-circle"></i></span>
              <div className="mode-text">
                <strong>Fácil</strong>
                <span>Velocidade constante. Bom para relaxar.</span>
              </div>
            </button>
            <button className="mode-btn" onClick={() => { setDifficulty("medium"); setStatus("menu_size"); }}>
              <span className="mode-icon" style={{color: '#ffcc00'}}><i className="fa-solid fa-circle"></i></span>
              <div className="mode-text">
                <strong>Médio</strong>
                <span>Fica mais rápida gradualmente.</span>
              </div>
            </button>
            <button className="mode-btn" onClick={() => { setDifficulty("hard"); setStatus("menu_size"); }}>
              <span className="mode-icon" style={{color: '#ff6600'}}><i className="fa-solid fa-circle"></i></span>
              <div className="mode-text">
                <strong>Difícil</strong>
                <span>Aceleração agressiva!</span>
              </div>
            </button>
          </div>
          <button className="btn btn-back" style={{marginTop: '20px'}} onClick={onBackToApp}>
            ← Voltar ao Menu Principal
          </button>
        </div>
      </div>
    );
  }

  if (status === "menu_size") {
    return (
      <div className="game">
        <div className="mode-select">
          <h1>Cobrinha</h1>
          <p>Escolha o Tamanho da Grade</p>
          <div className="mode-buttons">
            <button className="mode-btn" onClick={() => { setSize(10); startGame(difficulty, 10); }}>
              <span className="mode-icon" style={{color: '#00f2ff'}}><i className="fa-solid fa-expand"></i></span>
              <div className="mode-text">
                <strong>Pequena (10x10)</strong>
                <span>Pouco espaço, muito risco!</span>
              </div>
            </button>
            <button className="mode-btn" onClick={() => { setSize(14); startGame(difficulty, 14); }}>
              <span className="mode-icon" style={{color: '#bc13fe'}}><i className="fa-solid fa-expand"></i></span>
              <div className="mode-text">
                <strong>Média (14x14)</strong>
                <span>O tamanho clássico.</span>
              </div>
            </button>
            <button className="mode-btn" onClick={() => { setSize(18); startGame(difficulty, 18); }}>
              <span className="mode-icon" style={{color: '#ff0055'}}><i className="fa-solid fa-expand"></i></span>
              <div className="mode-text">
                <strong>Grande (18x18)</strong>
                <span>Espaço de sobra para crescer.</span>
              </div>
            </button>
          </div>
          <button className="btn btn-back" style={{marginTop: '20px'}} onClick={() => setStatus("menu_difficulty")}>
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  let statusMsg = "Pontos: " + score;
  let statusClass = "status-ms";
  if (status === "lost") {
    statusMsg = <span><i className="fa-solid fa-skull-crossbones"></i> Fim de Jogo!</span>;
    statusClass = "status-x";
  }

  return (
    <div 
      className="game" 
      style={{ maxWidth: '400px', width: '95vw', touchAction: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mode-indicator">Cobrinha ({currentDiff.label})</div>
      <div className={`status ${statusClass}`}>{statusMsg}</div>

      <div className="snake-board" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {Array.from({ length: size * size }).map((_, i) => {
          const x = i % size;
          const y = Math.floor(i / size);
          const isSnake = snake.some(s => s.x === x && s.y === y);
          const isHead = snake[0].x === x && snake[0].y === y;
          const isApple = apple.x === x && apple.y === y;
          
          let classes = "snake-cell";
          if (isHead) classes += " snake-head";
          else if (isSnake) classes += " snake-body";
          else if (isApple) classes += " snake-apple";

          return <div key={i} className={classes}></div>;
        })}
      </div>

      <div className="action-buttons">
        <button className="btn btn-next" onClick={() => startGame(difficulty, size)}>
          {status === "lost" ? "Tentar Novamente" : "Reiniciar"}
        </button>
        <button className="btn btn-back" onClick={() => setStatus("menu_difficulty")}>
          ← Menu da Cobrinha
        </button>
      </div>
    </div>
  );
}
