# 🕹️ React Fliperama

Uma coleção interativa de 6 mini-jogos clássicos construída como uma Single Page Application (SPA) em React, com sistema de temas personalizáveis, autenticação e ranking global em tempo real integrado ao Supabase.

## 🔗 Acesse o Projeto
👉 **[Jogue agora no GitHub Pages](https://barroca07.github.io/React_Fliperama/)**

---

## 🎮 Jogos Inclusos

* **Jogo da Velha (`js/TicTacToe.js`):** O tradicional jogo de estratégia X contra O, com suporte a 2 jogadores locais ou partidas contra a IA em 4 níveis (Fácil, Médio, Difícil e Imbatível com Minimax).
* **Campo Minado (`js/Minesweeper.js`):** Jogo de raciocínio lógico e dedução com abertura recursiva de células seguras, marcação de bandeiras e 3 dificuldades contra o tempo.
* **Cobrinha (`js/Snake.js`):** O clássico jogo de reflexos com 3 tamanhos de arena (`10×10`, `14×14`, `18×18`), 3 velocidades e fila de direções para respostas rápidas.
* **Batalha Naval (`js/Battleship.js`):** Jogo estratégico de posicionamento de frota e ataques por turnos contra uma IA com memória de busca e caça de navios.
* **Geometry Dash (`js/GeometryDash.js`):** Jogo de corrida e pulo em `Canvas` com física em 120 Hz, velocidade progressiva, mapas variados por dificuldade e personalização de cor, estilo do cubo e cenário.
* **Tetris (`js/Tetris.js`):** O clássico quebra-cabeça de blocos em grade `10×20` com projeção de sombra (ghost piece), prévia da próxima peça, suporte a Setas / `WASD` / `Espaço` e 3 velocidades de queda.

---

## 📂 Estrutura de Pastas

```text
React_Fliperama/
├── index.html               # Entrada principal da aplicação (HTML5)
├── style.css                # Ponto de importação dos estilos modulares
├── README.md                # Documentação do projeto
├── js/                      # Módulos e jogos em React (JSX / Babel)
│   ├── App.js               # Roteamento da SPA, temas e barra superior
│   ├── Supabase.js          # Cliente Supabase, autenticação e envio de partidas
│   ├── Leaderboard.js       # Ranking completo, painel top 5, modal de login e toasts
│   ├── TicTacToe.js         # Jogo da Velha
│   ├── Minesweeper.js       # Campo Minado
│   ├── Snake.js             # Jogo da Cobrinha
│   ├── Battleship.js        # Batalha Naval
│   ├── GeometryDash.js      # Geometry Dash
│   └── Tetris.js            # Tetris
├── css/                     # Folhas de estilo separadas por módulo/jogo
│   ├── global.css           # Variáveis de tema (claro/escuro + 7 cores) e layout geral
│   ├── leaderboard.css      # Estilos do ranking e autenticação
│   ├── tictactoe.css        # Estilos do Jogo da Velha
│   ├── minesweeper.css      # Estilos do Campo Minado
│   ├── snake.css            # Estilos da Cobrinha
│   ├── battleship.css       # Estilos da Batalha Naval
│   ├── geometrydash.css     # Estilos do Geometry Dash
│   └── tetris.css           # Estilos do Tetris
└── supabase/                # Scripts SQL para configuração do banco de dados
    ├── schema.sql           # Criação completa das tabelas, RLS, triggers e views
    ├── fix_profiles.sql     # Sincronização de perfis e coluna de senha
    ├── add_geometrydash.sql # Atualização da constraint para incluir o Geometry Dash
    └── add_tetris.sql       # Atualização da constraint para incluir o Tetris
```

---

## 🛠️ Tecnologias Utilizadas

* **React 17 + Babel Standalone:** Componentização, hooks (`useState`, `useEffect`, `useRef`) e gerenciamento de estado direto no navegador.
* **HTML5 & Canvas API:** Estrutura semântica e renderização gráfica em 60+ FPS para o Geometry Dash.
* **CSS3 Modular:** Variáveis CSS dinâmicas, animações, modo claro/escuro e 7 paletas de cores.
* **Supabase (PostgreSQL + Auth):** Autenticação por apelido + senha e views de ranking por jogo, modo e geral.

---

## ⚙️ Como Executar Localmente

1. Faça o clone deste repositório:
   ```bash
   git clone https://github.com/Barroca07/React_Fliperama.git
   ```
2. Acesse a pasta do projeto:
   ```bash
   cd React_Fliperama
   ```
3. Inicie um servidor estático local (por exemplo, com a extensão **Live Server** do VS Code ou via Python/Node):
   ```bash
   npx serve .
   ```
4. Abra o endereço exibido no navegador (ex.: `http://localhost:3000`).
