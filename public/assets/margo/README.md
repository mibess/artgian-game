# Margô — personagem aguardando a arte

Coloque nesta pasta os três PNGs transparentes (2048 × 2048, grade 8 × 8, quadros 256 × 256):

- `margo_idle_sheet.png`
- `margo_walk_sheet.png`
- `margo_jump_sheet.png`

Reinicie o Vite ou faça novo build. Margô aparece automaticamente na seleção somente quando os três arquivos existirem. A fase Quintal já funciona com os personagens atuais.

Orientação: personagem olhando para a direita. Centro horizontal x=128 e linha das patas em y≈238, constante entre poses. O salto usa os quadros 12 (saída), 35 (ápice) e 53 (queda). Pode ajustar origem, escala por ação e quadros na configuração `margo` de `src/config/characters.ts` quando a arte final estiver pronta. O corpo de colisão segue o padrão atual do jogo; a escala específica da gata ainda precisa ser conferida com a arte real.
