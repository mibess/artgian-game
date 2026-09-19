# Margô — animações da personagem

Os três PNGs originais são preservados nesta pasta:

- `margo_idle_sheet.png`
- `margo_walk_sheet.png`
- `margo_jump_sheet.png`

Cada arquivo contém 60 quadros em uma grade 8 × 8; as quatro últimas células estão vazias. O idle original mede 8640 × 15360, e walk/jump medem 15360 × 8640.

O jogo carrega somente as versões otimizadas em `runtime/`: 2048 × 2048, quadros 256 × 256, mantendo os 60 quadros e a transparência. Os originais grandes não entram no build de produção.

Para atualizar depois de substituir os originais, execute `python3 scripts/pack-margo-sheets.py` na raiz do projeto (requer Pillow). O script valida dimensões, células vazias e possíveis cortes. Cada ação usa uma transformação fixa, sem recentralizar cada quadro; caminhada e salto compartilham escala e apoio das patas. Os originais não são sobrescritos.

Margô está disponível na seleção. O idle roda a 24 fps; a caminhada acompanha a velocidade; o salto acompanha subida, ápice e queda, seguido pelo pouso. A configuração fica em `src/config/characters.ts`. As colisões seguem as mesmas regras dos outros personagens.
