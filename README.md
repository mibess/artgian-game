# Camada por camada — Artgian

MVP de plataforma vertical em Phaser 3, TypeScript e Vite. Resolução lógica 540 × 960 (9:16), redimensionada proporcionalmente. Uma fase com 28 plataformas, 15 filamentos, 3 vidas e checkpoints aproximadamente em 25%, 50% e 75%.

## Executar

```sh
npm install
npm run dev
```

No celular na mesma rede, abra o endereço Network mostrado pelo Vite. Desktop: A/D ou setas para andar, espaço para pular, Esc para pausar. Celular: botões direcionais e Pular; suporta toques simultâneos. O botão ♫ alterna áudio. O áudio é sintetizado e começa após interação.

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

## Assets e limites do MVP

`public/assets/character-sheet.png` é a folha de poses fornecida. O carregamento recorta as 16 células e normaliza os pés em `src/art/textures.ts`. Animação por poses: não há interpolação esquelética nem ciclo de corrida desenhado quadro a quadro. Oficina, plataformas, carretel e chapéu são placeholders procedurais independentes, substituíveis pelas mesmas chaves de textura. Nenhuma imagem completa da referência é usada como cenário.

O áudio é um placeholder procedural (ambiente de impressora e efeitos); trilha definitiva pode ser integrada em `AudioSystem`. A próxima impressão reinicia a fase atual. Não há salvamento persistente.

Validação automatizada: TypeScript, build de produção, alcance geométrico de todos os saltos, progressão, colecionáveis e checkpoints. Ajuste fino de dificuldade e teste em aparelhos físicos ainda requerem playtesting.
