# Padrão de animação dos obstáculos

Arquivos: `assets/levels/<fase>/<item>_idle_sheet.png` e
`<item>_warn_sheet.png`. PNG RGBA 2048×2048, grade 8×8, 64 quadros de
256×256, na ordem esquerda-direita e cima-baixo.

Registrar somente arquivos existentes em `src/config/hazardAnimations.ts`.
Cada estado tem tamanho e origem próprios para alinhar o corpo do objeto,
independentemente do espaço ocupado pela fumaça. Idle roda a 12 quadros/s.
Warn acompanha o ciclo de aviso e dano; o quadro da explosão é configurável.
O tempo usado é o do jogo, portanto a animação respeita pausa.

Chaleira: 2200ms idle, 700ms preparação (warn 0–24), 1500ms perigo
(warn 25–63). Depois retorna ao idle. A hitbox e os avisos existentes não mudam.
Sem warn carregado, usa idle; sem animação registrada, mantém o visual antigo.
Ao integrar sheets de outro obstáculo, conectar seu objeto visual ao mesmo
resolvedor `hazardAnimationPose`, mantendo os efeitos e colisões próprios.
