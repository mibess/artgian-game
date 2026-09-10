# Artgian Jump

Jogo de plataforma vertical em Phaser 3, TypeScript e Vite, com backend Worker e D1 para recompensas. Resolução lógica 540 × 960 (9:16), redimensionada proporcionalmente. Três fases com 49 plataformas, 25 filamentos e 3 vidas.

## Executar

```sh
npm install
npm run dev
```

Use Node 24+. No celular na mesma rede, abra o endereço Network mostrado pelo Vite. Desktop: A/D ou setas para andar, espaço para pular, Esc para pausar. Celular: botões direcionais e Pular; suporta toques simultâneos. O botão ♫ alterna áudio. O áudio é sintetizado e começa após interação.

```sh
npm run build
npm run preview
npm test
```

## Implementação

- `entities/`: personagem, física responsiva, coyote time de 110 ms, buffer de 130 ms, plataformas e filamentos.
- `systems/LevelSystem.ts`: configuração da fase e posições; tipos normal, pequena, horizontal, vertical, temporária e impulso.
- `systems/PrintingProgressSystem.ts`: peça revelada por máscara, cabeçote e luz; progresso baseado na maior altura alcançada, preservado após quedas.
- `systems/CheckpointSystem.ts`: checkpoints seguros, sem regressão.
- `scenes/`: jogo, game over e conclusão com contagem, tempo e vidas.
- `art/Workshop.ts`: oficina, bobinas, trilhos e cabos em camadas de parallax.
- `ui/`: HUD e controles touch isolados, preparados para trocar por joystick.

Quedas em plataformas inferiores são permitidas. Cair abaixo da margem da câmera ou do mundo perde uma vida; obstáculos também. Após reaparecer, há dois segundos de invulnerabilidade. Plataformas temporárias desaparecem após 1,7 s e retornam após 2,8 s. Lasers alternam períodos de atividade. Todos os filamentos são opcionais; 15/15 concede celebração visual.

## Assets e direção de arte

A folha de poses do personagem foi fornecida pelo usuário. A apresentação usa texturas de maior resolução, com alpha preservado, e escala independente do corpo de colisão. Animação por poses; não há interpolação esquelética.

`public/assets/workshop-depth.png` é uma camada distante de oficina criada a partir da referência. `workshop-atlas.png` contém peças independentes: plataformas, pistão, cabeçote, mesa, chaveiro, carretel, coração, ventilador, coluna e prateleira. O carregador recorta as regiões e remove o fundo claro conectado às bordas. Trilhos, placas, props, gameplay e impressão são planos distintos. A referência inteira não é usada como fundo jogável.

A composição foi refinada em cinco rodadas de capturas: proporções, iluminação, elementos principais, profundidade e polimento. As capturas ficam em `artifacts/visual/`. Veja `ASSETS.md` para os briefs de geração.

## Validação

TypeScript, build de produção e testes automatizados de física, percursos completos nas três fases, assets, checkpoints e integração de cupons. Os testes de backend usam SQLite e respostas simuladas da loja, sem emitir cupons reais.

Em desenvolvimento, abra `/?qa=1`: P alterna um percurso automático de teste que envia apenas movimento e salto, com pausas no checkpoint central e na penúltima plataforma. K captura o framebuffer do jogo. Esse módulo é removido do build de produção. Ele não altera vidas, não teletransporta o jogador e não desativa obstáculos.

O áudio continua sintetizado. A próxima impressão reinicia esta fase. Partidas anônimas têm validação por reprodução de comandos no servidor e recompensa persistida por conclusão. O cupom salvo reaparece ao recarregar. A partida em andamento não é retomada após recarga. Aparelhos físicos ainda podem exigir ajuste fino de desempenho e controles.

Consulte [a integração de cupons](docs/cupons-jogo.md) para sessões anônimas, persistência, repetição de chamadas e configuração de produção. O jogo precisa ser publicado como Worker com D1, e `COUPON_GAME_API_KEY` deve existir somente no ambiente secreto dos servidores do jogo e da loja.
