// ===== GeometryDash.js =====
// Versão simplificada do Geometry Dash: o cubo corre sozinho, você só pula.
// Fases infinitas geradas aleatoriamente, com personalização de cor, estilo e cenário.

// ---------- Constantes do mundo (coordenadas lógicas do canvas) ----------
const GD_W = 800;
const GD_H = 400;
const GD_BLOCK = 40;
const GD_GROUND = 320;          // y do topo do chão
const GD_PLAYER_X = 160;        // posição fixa do cubo na tela
const GD_GRAVITY = 6200;        // px/s²
const GD_JUMP = 1380;           // velocidade inicial do pulo (px/s)
const GD_AIR_TIME = (2 * GD_JUMP) / GD_GRAVITY;
const GD_STEP = 1 / 120;        // passo fixo da física

// Cada dificuldade tem velocidade mais alta, acelera com o tempo e muda o mapa
const GD_DIFFICULTIES = [
  {
    id: "easy", label: "Fácil", desc: "Mapa simples • Rápido", color: "#00ff73", icon: "fa-solid fa-leaf",
    speed: 470, accel: 10, maxSpeed: 760, extraGap: 5,
    patterns: ["spike1", "spike1", "block1", "blockWide", "lowStep", "wideBridge"],
  },
  {
    id: "medium", label: "Médio", desc: "Mapa médio • Muito rápido", color: "#ffcc00", icon: "fa-solid fa-bolt",
    speed: 530, accel: 13, maxSpeed: 850, extraGap: 4,
    patterns: ["spike1", "spike2", "blockWide", "stairs", "blockSpike", "platformSpike", "pillar", "twinBlocks"],
  },
  {
    id: "hard", label: "Difícil", desc: "Mapa complexo • Insano", color: "#ff3366", icon: "fa-solid fa-fire",
    speed: 600, accel: 16, maxSpeed: 940, extraGap: 2,
    patterns: ["spike2", "spike3", "blockSpike", "platformSpike", "tallStairs", "doublePlatform", "spikeBridge", "fortress"],
  },
];

// Padrões de obstáculos em unidades de bloco.
// spike: x, e (elevação da base) | block: x, w (largura), h (altura)
const GD_PATTERNS = {
  // Mapas Fáceis
  spike1: [{ t: "spike", x: 0 }],
  block1: [{ t: "block", x: 0, w: 1, h: 1 }],
  blockWide: [{ t: "block", x: 0, w: 4, h: 1 }],
  lowStep: [{ t: "block", x: 0, w: 3, h: 1 }, { t: "block", x: 5, w: 3, h: 1 }],
  wideBridge: [{ t: "block", x: 0, w: 6, h: 1 }],

  // Mapas Médios
  spike2: [{ t: "spike", x: 0 }, { t: "spike", x: 1 }],
  blockSpike: [{ t: "block", x: 0, w: 1, h: 1 }, { t: "spike", x: 1 }],
  stairs: [{ t: "block", x: 0, w: 4, h: 1 }, { t: "block", x: 4, w: 4, h: 2 }],
  platformSpike: [{ t: "block", x: 0, w: 9, h: 1 }, { t: "spike", x: 5, e: 1 }],
  pillar: [{ t: "block", x: 0, w: 1, h: 2 }],
  twinBlocks: [{ t: "block", x: 0, w: 3, h: 1 }, { t: "spike", x: 3 }, { t: "block", x: 4, w: 3, h: 1 }],

  // Mapas Difíceis
  spike3: [{ t: "spike", x: 0 }, { t: "spike", x: 1 }, { t: "spike", x: 2 }],
  tallStairs: [
    { t: "block", x: 0, w: 4, h: 1 },
    { t: "block", x: 4, w: 4, h: 2 },
    { t: "block", x: 8, w: 4, h: 3 },
  ],
  doublePlatform: [
    { t: "block", x: 0, w: 4, h: 1 },
    { t: "spike", x: 4 }, { t: "spike", x: 5 },
    { t: "block", x: 6, w: 4, h: 1 },
  ],
  spikeBridge: [
    { t: "block", x: 0, w: 10, h: 1 },
    { t: "spike", x: 4, e: 1 }, { t: "spike", x: 5, e: 1 },
  ],
  fortress: [
    { t: "block", x: 0, w: 4, h: 1 },
    { t: "spike", x: 4 },
    { t: "block", x: 5, w: 5, h: 2 },
    { t: "spike", x: 8, e: 2 },
  ],
};

// ---------- Personalização ----------
const GD_COLORS = [
  { id: "cyan", name: "Ciano", hex: "#00f2ff" },
  { id: "yellow", name: "Amarelo", hex: "#ffcc00" },
  { id: "pink", name: "Rosa", hex: "#ff3399" },
  { id: "green", name: "Verde", hex: "#00ff73" },
  { id: "orange", name: "Laranja", hex: "#ff7a00" },
  { id: "purple", name: "Roxo", hex: "#bc13fe" },
];

const GD_STYLES = [
  { id: "classic", label: "Clássico", icon: "fa-solid fa-square" },
  { id: "face", label: "Carinha", icon: "fa-solid fa-face-smile" },
  { id: "neon", label: "Neon", icon: "fa-regular fa-square" },
  { id: "split", label: "Dividido", icon: "fa-solid fa-circle-half-stroke" },
];

const GD_SCENERIES = [
  { id: "neon", label: "Neon", bgTop: "#12042b", bgBottom: "#3a0ca3", ground: "#0d021f", line: "#00f2ff", block: "#1e0d45", spike: "#ff3366", spikeFill: "#1a0526", deco: "rgba(0, 242, 255, 0.10)" },
  { id: "sunset", label: "Pôr do sol", bgTop: "#2b0f3a", bgBottom: "#ff6b3d", ground: "#24091a", line: "#ffcc00", block: "#45132e", spike: "#ffffff", spikeFill: "#2a0b1c", deco: "rgba(255, 204, 0, 0.12)" },
  { id: "ocean", label: "Oceano", bgTop: "#021a2b", bgBottom: "#0077b6", ground: "#011522", line: "#48e5ff", block: "#06324d", spike: "#ff66aa", spikeFill: "#03192a", deco: "rgba(72, 229, 255, 0.10)" },
  { id: "matrix", label: "Matrix", bgTop: "#000000", bgBottom: "#03240f", ground: "#000000", line: "#00ff73", block: "#04210f", spike: "#00ff73", spikeFill: "#001a08", deco: "rgba(0, 255, 115, 0.08)" },
];

function gdLoad(key, list, fallback) {
  const saved = localStorage.getItem(key);
  return list.some((i) => i.id === saved) ? saved : fallback;
}

function gdBestKey(diff) {
  return `fliperama-gd-best-${diff}`;
}

function readGdBest(diff) {
  return Number(localStorage.getItem(gdBestKey(diff))) || 0;
}

// Clareia (amt > 0) ou escurece (amt < 0) uma cor hex
function gdShade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const target = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  const mix = (c) => Math.round((target - c) * p + c);
  return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

// ---------- Desenho do cubo ----------
function gdDrawCube(ctx, cx, cy, size, rot, hex, style) {
  const s = size;
  const h = s / 2;
  const dark = gdShade(hex, -0.55);
  const light = gdShade(hex, 0.45);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.shadowColor = hex;
  ctx.shadowBlur = s * 0.4;

  if (style === "neon") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(-h, -h, s, s);
    ctx.strokeStyle = hex;
    ctx.lineWidth = s * 0.1;
    ctx.strokeRect(-h + s * 0.05, -h + s * 0.05, s * 0.9, s * 0.9);
    ctx.lineWidth = s * 0.07;
    ctx.strokeRect(-s * 0.17, -s * 0.17, s * 0.34, s * 0.34);
  } else {
    ctx.fillStyle = hex;
    ctx.fillRect(-h, -h, s, s);
    ctx.shadowBlur = 0;

    if (style === "classic") {
      ctx.fillStyle = dark;
      ctx.fillRect(-s * 0.28, -s * 0.28, s * 0.56, s * 0.56);
      ctx.fillStyle = light;
      ctx.fillRect(-s * 0.12, -s * 0.12, s * 0.24, s * 0.24);
    } else if (style === "face") {
      ctx.fillStyle = "#0a0a12";
      ctx.fillRect(-s * 0.3, -s * 0.24, s * 0.18, s * 0.2);
      ctx.fillRect(s * 0.12, -s * 0.24, s * 0.18, s * 0.2);
      ctx.fillRect(-s * 0.28, s * 0.12, s * 0.56, s * 0.1);
      ctx.fillRect(-s * 0.28, s * 0.04, s * 0.08, s * 0.12);
      ctx.fillRect(s * 0.2, s * 0.04, s * 0.08, s * 0.12);
    } else if (style === "split") {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(h, -h);
      ctx.lineTo(h, h);
      ctx.lineTo(-h, h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = light;
      ctx.fillRect(-s * 0.1, -s * 0.1, s * 0.2, s * 0.2);
    }

    ctx.strokeStyle = "#0a0a12";
    ctx.lineWidth = Math.max(2, s * 0.07);
    ctx.strokeRect(-h, -h, s, s);
  }
  ctx.restore();
}

// ---------- Lógica do jogo ----------
function gdNewGame(diff) {
  return {
    diff,
    speed: diff.speed,
    camera: 0,
    y: GD_GROUND - GD_BLOCK,
    vy: 0,
    onGround: true,
    rot: 0,
    holding: false,
    objects: [],
    nextX: GD_PLAYER_X + 760,
    trail: [],
    particles: [],
    dead: false,
    deadTimer: 0,
    deathReported: false,
    flash: 0,
    startTime: null,
    acc: 0,
  };
}

function gdScore(g) {
  return Math.floor(g.camera / GD_BLOCK);
}

function gdSpawnPattern(g) {
  const list = g.diff.patterns;
  const parts = GD_PATTERNS[list[Math.floor(Math.random() * list.length)]];
  let width = 0;
  parts.forEach((p) => {
    const w = p.w || 1;
    g.objects.push({ t: p.t, w, h: p.h || 1, e: p.e || 0, x: g.nextX + p.x * GD_BLOCK });
    width = Math.max(width, p.x + w);
  });
  // Espaço mínimo garante tempo para aterrissar e pular de novo
  const minGap = Math.ceil((g.speed * GD_AIR_TIME) / GD_BLOCK) + 1;
  const gap = minGap + Math.floor(Math.random() * (g.diff.extraGap + 1));
  g.nextX += (width + gap) * GD_BLOCK;
}

function gdKill(g) {
  g.dead = true;
  g.deadTimer = 0.8;
  g.flash = 0.6;
  const cx = GD_PLAYER_X + GD_BLOCK / 2;
  const cy = g.y + GD_BLOCK / 2;
  for (let i = 0; i < 28; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 150 + Math.random() * 450;
    g.particles.push({
      x: cx, y: cy,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 200,
      life: 0.6 + Math.random() * 0.5,
      size: 4 + Math.random() * 7,
    });
  }
}

function gdPhysicsStep(g, dt) {
  g.speed = Math.min(g.diff.maxSpeed, g.speed + g.diff.accel * dt);
  g.camera += g.speed * dt;

  if (g.holding && g.onGround) {
    g.vy = -GD_JUMP;
    g.onGround = false;
  }

  const prevBottom = g.y + GD_BLOCK;
  g.vy += GD_GRAVITY * dt;
  g.y += g.vy * dt;
  g.onGround = false;

  if (g.y + GD_BLOCK >= GD_GROUND) {
    g.y = GD_GROUND - GD_BLOCK;
    g.vy = 0;
    g.onGround = true;
  }

  const px = GD_PLAYER_X;
  for (const o of g.objects) {
    const sx = o.x - g.camera;
    if (sx > px + GD_BLOCK || sx + o.w * GD_BLOCK < px) continue;

    if (o.t === "block") {
      const top = GD_GROUND - o.h * GD_BLOCK;
      const overlapX = px + GD_BLOCK - 1 > sx && px + 1 < sx + o.w * GD_BLOCK;
      const overlapY = g.y + GD_BLOCK > top && g.y < GD_GROUND;
      if (overlapX && overlapY) {
        if (g.vy >= 0 && prevBottom <= top + 12) {
          g.y = top - GD_BLOCK;
          g.vy = 0;
          g.onGround = true;
        } else {
          gdKill(g);
          return;
        }
      }
    } else {
      // Hitbox reduzida do espinho (parte central do triângulo)
      const base = GD_GROUND - o.e * GD_BLOCK;
      const hx1 = sx + 13, hx2 = sx + GD_BLOCK - 13;
      const hy1 = base - 26, hy2 = base;
      const inset = 5;
      if (px + GD_BLOCK - inset > hx1 && px + inset < hx2 && g.y + GD_BLOCK - inset > hy1 && g.y + inset < hy2) {
        gdKill(g);
        return;
      }
    }
  }

  // Rotação: meia volta por pulo no ar; encaixa em 90° no chão
  const quarter = Math.PI / 2;
  if (!g.onGround) {
    g.rot += (Math.PI / GD_AIR_TIME) * dt;
  } else {
    const target = Math.round(g.rot / quarter) * quarter;
    g.rot += (target - g.rot) * Math.min(1, dt * 25);
  }
}

function gdUpdate(g, dt, onDeath) {
  if (g.flash > 0) g.flash = Math.max(0, g.flash - dt * 1.5);

  if (g.dead) {
    g.particles.forEach((p) => {
      p.vy += 1800 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    g.particles = g.particles.filter((p) => p.life > 0);
    g.deadTimer -= dt;
    if (g.deadTimer <= 0 && !g.deathReported) {
      g.deathReported = true;
      onDeath(g);
    }
    return;
  }

  g.acc += dt;
  while (g.acc >= GD_STEP && !g.dead) {
    gdPhysicsStep(g, GD_STEP);
    g.acc -= GD_STEP;
  }

  while (g.nextX < g.camera + GD_W + 200) gdSpawnPattern(g);
  g.objects = g.objects.filter((o) => o.x + o.w * GD_BLOCK > g.camera - 80);

  g.trail.push({ x: g.camera + GD_PLAYER_X, y: g.y, rot: g.rot });
  if (g.trail.length > 10) g.trail.shift();
}

// ---------- Desenho da cena ----------
function gdDrawScene(ctx, g, cfg, hud) {
  const { theme, color, style } = cfg;

  // Fundo
  const grad = ctx.createLinearGradient(0, 0, 0, GD_H);
  grad.addColorStop(0, theme.bgTop);
  grad.addColorStop(1, theme.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GD_W, GD_H);

  // Quadrados decorativos (parallax)
  const spacing = 160;
  const par = g.camera * 0.15;
  const first = Math.floor(par / spacing) - 1;
  ctx.strokeStyle = theme.deco;
  ctx.lineWidth = 3;
  for (let i = first; i < first + 8; i++) {
    const x = i * spacing - par;
    const row = ((i * 73) % 4 + 4) % 4;
    const size = 50 + (((i * 31) % 3 + 3) % 3) * 20;
    ctx.strokeRect(x, 30 + row * 55, size, size);
  }

  // Chão
  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, GD_GROUND, GD_W, GD_H - GD_GROUND);
  ctx.strokeStyle = theme.deco;
  ctx.lineWidth = 2;
  const gOff = g.camera % 80;
  for (let x = -gOff; x < GD_W; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, GD_GROUND);
    ctx.lineTo(x, GD_H);
    ctx.stroke();
  }
  ctx.save();
  ctx.shadowColor = theme.line;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, GD_GROUND);
  ctx.lineTo(GD_W, GD_GROUND);
  ctx.stroke();
  ctx.restore();

  // Obstáculos
  for (const o of g.objects) {
    const sx = o.x - g.camera;
    if (sx > GD_W || sx + o.w * GD_BLOCK < 0) continue;

    if (o.t === "block") {
      const top = GD_GROUND - o.h * GD_BLOCK;
      const w = o.w * GD_BLOCK;
      const hgt = o.h * GD_BLOCK;
      ctx.fillStyle = theme.block;
      ctx.fillRect(sx, top, w, hgt);
      ctx.strokeStyle = theme.deco;
      ctx.lineWidth = 2;
      for (let cx = 0; cx < o.w; cx++) {
        for (let cy = 0; cy < o.h; cy++) {
          ctx.strokeRect(sx + cx * GD_BLOCK + 7, top + cy * GD_BLOCK + 7, GD_BLOCK - 14, GD_BLOCK - 14);
        }
      }
      ctx.save();
      ctx.shadowColor = theme.line;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(sx + 1, top + 1, w - 2, hgt - 2);
      ctx.restore();
    } else {
      const base = GD_GROUND - o.e * GD_BLOCK;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sx + 3, base);
      ctx.lineTo(sx + GD_BLOCK / 2, base - GD_BLOCK + 4);
      ctx.lineTo(sx + GD_BLOCK - 3, base);
      ctx.closePath();
      ctx.fillStyle = theme.spikeFill;
      ctx.fill();
      ctx.shadowColor = theme.spike;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = theme.spike;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  // Rastro + cubo
  if (!g.dead) {
    g.trail.forEach((t, i) => {
      const k = (i + 1) / g.trail.length;
      const size = GD_BLOCK * (0.35 + 0.4 * k);
      ctx.globalAlpha = 0.25 * k;
      ctx.fillStyle = color;
      ctx.fillRect(t.x - g.camera + GD_BLOCK / 2 - size / 2 - (g.trail.length - i) * 2, t.y + GD_BLOCK / 2 - size / 2, size, size);
    });
    ctx.globalAlpha = 1;
    gdDrawCube(ctx, GD_PLAYER_X + GD_BLOCK / 2, g.y + GD_BLOCK / 2, GD_BLOCK, g.rot, color, style);
  }

  // Partículas da explosão
  g.particles.forEach((p) => {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  });
  ctx.globalAlpha = 1;

  if (g.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${g.flash * 0.5})`;
    ctx.fillRect(0, 0, GD_W, GD_H);
  }

  // HUD
  ctx.save();
  ctx.font = "800 26px Outfit, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 6;
  ctx.textAlign = "left";
  ctx.fillText(`${gdScore(g)} m`, 18, 14);
  ctx.font = "700 15px Outfit, sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = "#ffcc00";
  ctx.fillText(`🏆 Recorde ${Math.max(hud.best, gdScore(g))} m`, GD_W - 18, 16);
  const speedMult = (g.speed / g.diff.speed).toFixed(1);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText(`Tentativa ${hud.attempt} • ${speedMult}x`, GD_W / 2, 16);
  ctx.restore();
}

// Pré-visualização do cubo na tela de configuração
function GdCubePreview({ color, style }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 80 * dpr;
    canvas.height = 80 * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 80, 80);
    gdDrawCube(ctx, 40, 40, 48, 0, color, style);
  }, [color, style]);
  return <canvas ref={ref} className="gd-preview-canvas" style={{ width: 80, height: 80 }} />;
}

// ---------- Componente ----------
function GeometryDash({ onBackToApp }) {
  const [difficulty, setDifficulty] = React.useState(() => gdLoad("fliperama-gd-diff", GD_DIFFICULTIES, "medium"));
  const [cubeColor, setCubeColor] = React.useState(() => gdLoad("fliperama-gd-color", GD_COLORS, "cyan"));
  const [cubeStyle, setCubeStyle] = React.useState(() => gdLoad("fliperama-gd-style", GD_STYLES, "classic"));
  const [scenery, setScenery] = React.useState(() => gdLoad("fliperama-gd-scenery", GD_SCENERIES, "neon"));

  // 'setup' | 'ready' | 'playing' | 'paused' | 'dead'
  const [status, setStatus] = React.useState("setup");
  const [finalScore, setFinalScore] = React.useState(0);
  const [best, setBest] = React.useState(0);
  const [isNewRecord, setIsNewRecord] = React.useState(false);

  const canvasRef = React.useRef(null);
  const gameRef = React.useRef(null);
  const statusRef = React.useRef(status);
  const bestRef = React.useRef(0);
  const attemptRef = React.useRef(0);
  const startGameRef = React.useRef(null);
  const handleDeathRef = React.useRef(null);

  const currentDiff = GD_DIFFICULTIES.find((d) => d.id === difficulty) || GD_DIFFICULTIES[1];
  const colorHex = (GD_COLORS.find((c) => c.id === cubeColor) || GD_COLORS[0]).hex;
  const theme = GD_SCENERIES.find((s) => s.id === scenery) || GD_SCENERIES[0];
  const configRef = React.useRef({});
  configRef.current = { theme, color: colorHex, style: cubeStyle };

  function setStatusNow(next) {
    statusRef.current = next;
    setStatus(next);
  }

  function startGame() {
    localStorage.setItem("fliperama-gd-diff", difficulty);
    localStorage.setItem("fliperama-gd-color", cubeColor);
    localStorage.setItem("fliperama-gd-style", cubeStyle);
    localStorage.setItem("fliperama-gd-scenery", scenery);
    const b = readGdBest(difficulty);
    bestRef.current = b;
    setBest(b);
    attemptRef.current += 1;
    setIsNewRecord(false);
    gameRef.current = gdNewGame(currentDiff);
    setStatusNow("ready");
  }
  startGameRef.current = startGame;

  handleDeathRef.current = (g) => {
    const score = gdScore(g);
    setFinalScore(score);
    if (score > bestRef.current) {
      localStorage.setItem(gdBestKey(g.diff.id), String(score));
      bestRef.current = score;
      setBest(score);
      setIsNewRecord(score > 0);
    }
    if (g.startTime) {
      recordGameResult({
        game: "geometrydash",
        mode: g.diff.id,
        result: "loss",
        durationMs: Date.now() - g.startTime,
        score,
      });
    }
    setStatusNow("dead");
  };

  function pressJump() {
    const g = gameRef.current;
    if (!g) return;
    g.holding = true;
    const st = statusRef.current;
    if (st === "ready") {
      g.startTime = Date.now();
      setStatusNow("playing");
    } else if (st === "paused") {
      setStatusNow("playing");
    }
  }

  function releaseJump() {
    if (gameRef.current) gameRef.current.holding = false;
  }

  function togglePause() {
    const g = gameRef.current;
    if (g && g.dead) return;
    if (statusRef.current === "playing") {
      if (g) g.holding = false;
      setStatusNow("paused");
    } else if (statusRef.current === "paused") {
      setStatusNow("playing");
    }
  }

  // Teclado
  React.useEffect(() => {
    const isJumpKey = (k) => k === " " || k === "ArrowUp" || k === "w" || k === "W";

    function onKeyDown(e) {
      const st = statusRef.current;
      if (st === "setup") return;
      if (isJumpKey(e.key) || e.key === "Enter") e.preventDefault();

      if (e.key === "p" || e.key === "P") {
        togglePause();
        return;
      }
      if (st === "dead") {
        if ((isJumpKey(e.key) || e.key === "Enter") && !e.repeat) startGameRef.current();
        return;
      }
      if (isJumpKey(e.key)) pressJump();
    }

    function onKeyUp(e) {
      if (isJumpKey(e.key)) releaseJump();
    }

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", releaseJump);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", releaseJump);
    };
  }, []);

  // Loop principal (requestAnimationFrame)
  const inGame = status !== "setup";
  React.useEffect(() => {
    if (!inGame) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = GD_W * dpr;
    canvas.height = GD_H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf;
    let last = performance.now();
    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const g = gameRef.current;
      if (g) {
        if (statusRef.current === "playing") {
          gdUpdate(g, dt, (game) => handleDeathRef.current(game));
        }
        gdDrawScene(ctx, g, configRef.current, { best: bestRef.current, attempt: attemptRef.current });
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [inGame]);

  const noFocus = (e) => e.preventDefault();

  // ===== Tela de configuração =====
  if (status === "setup") {
    const savedBest = readGdBest(difficulty);
    return (
      <div className="game gd-setup">
        <div className="setup-header">
          <div className="gd-preview" style={{ background: `linear-gradient(180deg, ${theme.bgTop}, ${theme.bgBottom})`, borderColor: theme.line }}>
            <GdCubePreview color={colorHex} style={cubeStyle} />
          </div>
          <h1>Geometry Dash</h1>
          <p>Pule no ritmo e desvie dos espinhos!</p>
        </div>

        <div className="option-group">
          <div className="option-label">Dificuldade</div>
          <div className="option-grid">
            {GD_DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                id={`gd-diff-${d.id}`}
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

        <div className="option-group">
          <div className="option-label">Cor do cubo</div>
          <div className="gd-swatches">
            {GD_COLORS.map((c) => (
              <button
                key={c.id}
                id={`gd-color-${c.id}`}
                className={`gd-swatch ${cubeColor === c.id ? "active" : ""}`}
                style={{ "--swatch": c.hex }}
                title={c.name}
                aria-label={c.name}
                onClick={() => setCubeColor(c.id)}
              />
            ))}
          </div>
        </div>

        <div className="option-group">
          <div className="option-label">Estilo do cubo</div>
          <div className="option-grid gd-grid-4">
            {GD_STYLES.map((s) => (
              <button
                key={s.id}
                id={`gd-style-${s.id}`}
                className={`option-card ${cubeStyle === s.id ? "active" : ""}`}
                style={{ "--opt-color": colorHex }}
                onClick={() => setCubeStyle(s.id)}
              >
                <i className={s.icon}></i>
                <strong>{s.label}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <div className="option-label">Cenário</div>
          <div className="option-grid gd-grid-4">
            {GD_SCENERIES.map((s) => (
              <button
                key={s.id}
                id={`gd-scenery-${s.id}`}
                className={`option-card gd-scenery-card ${scenery === s.id ? "active" : ""}`}
                style={{ "--opt-color": s.line }}
                onClick={() => setScenery(s.id)}
              >
                <span className="gd-scenery-thumb" style={{ background: `linear-gradient(180deg, ${s.bgTop}, ${s.bgBottom})`, borderBottomColor: s.line }} />
                <strong>{s.label}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="best-line">
          <i className="fa-solid fa-trophy"></i>
          Seu recorde neste modo: <strong>{savedBest} m</strong>
        </div>

        <div className="action-buttons">
          <button id="gd-play-btn" className="btn btn-next btn-lg" onClick={startGame}>
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
  const canPause = status === "playing" || status === "paused";

  return (
    <div className="game gd-game">
      <div className="game-header">
        <button className="icon-btn" title="Trocar modo" onMouseDown={noFocus} onClick={() => setStatusNow("setup")}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div className="game-header-title">
          <h2>Geometry Dash</h2>
          <div className="game-header-tags">
            <span className="chip" style={{ "--chip-color": currentDiff.color }}>
              <i className={currentDiff.icon}></i> {currentDiff.label}
            </span>
            <span className="chip" style={{ "--chip-color": theme.line }}>
              <i className="fa-solid fa-image"></i> {theme.label}
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

      <div className="gd-board" style={{ borderColor: theme.line }}>
        <canvas
          ref={canvasRef}
          className="gd-canvas"
          onPointerDown={(e) => { e.preventDefault(); if (statusRef.current !== "dead") pressJump(); }}
          onPointerUp={releaseJump}
          onPointerLeave={releaseJump}
          onPointerCancel={releaseJump}
          onContextMenu={(e) => e.preventDefault()}
        />

        {status === "ready" && (
          <div className="board-overlay gd-overlay-passive">
            <div className="board-overlay-card">
              <h3>Pronto?</h3>
              <p>Clique, toque ou aperte <kbd>Espaço</kbd> para pular</p>
            </div>
          </div>
        )}

        {status === "paused" && (
          <div className="board-overlay">
            <div className="board-overlay-card">
              <h3>Pausado</h3>
              <div className="board-overlay-actions gd-actions-row">
                <button className="btn btn-next" onMouseDown={noFocus} onClick={togglePause}>
                  <i className="fa-solid fa-play"></i> Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {status === "dead" && (
          <div className="board-overlay">
            <div className="board-overlay-card">
              <div className="board-overlay-score">{finalScore} m</div>
              {isNewRecord ? (
                <span className="record-badge"><i className="fa-solid fa-crown"></i> Novo recorde!</span>
              ) : (
                <p>Recorde: {best} m</p>
              )}
              <div className="board-overlay-actions gd-actions-row">
                <button id="gd-retry-btn" className="btn btn-next" onMouseDown={noFocus} onClick={startGame}>
                  <i className="fa-solid fa-rotate-right"></i> De novo
                </button>
                <button className="btn btn-back" onMouseDown={noFocus} onClick={() => setStatusNow("setup")}>
                  <i className="fa-solid fa-sliders"></i> Personalizar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="snake-hint">
        <kbd>Espaço</kbd><kbd>↑</kbd> ou clique para pular (segure para pular seguido)
        <span className="snake-hint-sep">•</span>
        <kbd>P</kbd> pausar
      </p>
    </div>
  );
}

