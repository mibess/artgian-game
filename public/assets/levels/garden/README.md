# Fase 4 · Quintal da Margô — A hora dourada

Um quintal acolhedor se abre para um campo dourado além da cerca. O sol baixo fica parcialmente escondido pelos morros, com nuvens rosadas em parallax. Madeira quente, almofadas terracota e um aspersor de latão completam o ambiente. A peça impressa é uma tigela com patinha para a Margô.

A fase já pode ser selecionada no menu: 49 plataformas, 25 filamentos, 7 pontos seguros contando o início e cinco aspersores e sete abelhas. Madeira pode se mover; almofadas cedem ao peso. Os aspersores alternam repouso, aviso e jato, como a chaleira. Usa os personagens existentes enquanto a Margô não fica pronta.

## Imagens para você animar

Todos os oito elementos novos estão em **`green-screen/`**, cada um em um PNG próprio com fundo verde opaco. O jogo remove o verde em memória; os arquivos desta pasta continuam com verde para exportar ao seu editor. Evite usar verde nas partes do objeto, pois essa cor será removida.

| Arquivo | Elemento | Sugestão de animação |
| --- | --- | --- |
| `sun.png` | Sol | Brilho muito suave |
| `cloud.png` | Nuvem rosada | Pequena mudança de volume, sem deslocar o centro |
| `meadow.png` | Campo, morros e cerca | Capim ao vento; preservar horizonte e cerca |
| `plank.png` | Plataforma de madeira | Movimento sutil, mantendo a superfície de apoio |
| `cushion.png` | Almofada | Respiração suave do tecido; a descida ao pisar já vem do jogo |
| `sprinkler.png` | Aspersor | Repouso + preparação + jato de água |
| `bowl.png` | Tigela da Margô | Brilho discreto para seleção e tela de vitória |
| `bee.png` | Abelha de perfil | Asas batendo, olhando para a direita; o jogo controla o voo |

O céu é um gradiente desenhado pelo jogo, portanto não exige uma imagem. Interface, impressora e filamentos continuam usando os assets compartilhados existentes. A cerca e os morros são uma única camada (`meadow.png`).

Artes criadas e ajustadas com a ferramenta integrada **image_gen**. Os prompts de geração e do ajuste final de fundo estão em `prompts.json`.

## Entregar as animações

Coloque as folhas em **`animations/`** e reinicie o servidor de desenvolvimento ou faça um novo build. Elas são detectadas automaticamente; sem arquivo, permanece a imagem estática. Não existem requisições a arquivos ausentes.

Padrão: PNG **2048 × 2048**, grade **8 × 8**, **64 quadros de 256 × 256**, da esquerda para a direita e de cima para baixo. Pode entregar fundo transparente ou verde. Não deixe espaços entre células. Para cenas e plataformas, a arte deve ocupar de forma consistente os limites de cada quadro: o quadro inteiro é redimensionado para o retângulo visual atual. Preserve a posição de apoio entre quadros; a colisão não acompanha deformações desenhadas.

Nomes aceitos:

- `sun_idle_sheet.png`
- `cloud_idle_sheet.png`
- `meadow_idle_sheet.png`
- `plank_idle_sheet.png`
- `cushion_idle_sheet.png`
- `bowl_idle_sheet.png`
- `bee_idle_sheet.png` e `bee_warn_sheet.png` (exceção compacta descrita abaixo)
- `sprinkler_idle_sheet.png`
- `sprinkler_warn_sheet.png`

As animações decorativas rodam a 12 fps e respeitam pausa e preferência por movimento reduzido. A tigela anima na seleção e na vitória; a miniatura da impressão fica estática para preservar a máscara de progresso. A prévia do cenário no menu também é estática.

### Aspersor: mesmo contrato da chaleira

- **Idle:** 2200 ms, animação em loop a 12 fps.
- **Warn, quadros 0–24:** 700 ms, sem dano; mostrar preparação.
- **Warn, quadros 25–63:** 1500 ms, com dano; desenhar o jato de água.
- Volta ao idle no fim dos 4400 ms. Cada aspersor tem uma defasagem própria.

No quadro 256 × 256, coloque o centro horizontal do corpo em x=128 e a base em y≈218 (origem 0.5, 0.85). O quadro aparece no jogo com 160 × 160 px. Para manter o tamanho estático, o corpo deve ocupar aproximadamente 136 × 99 px na folha, com a base em y=218 e bastante espaço acima para o jato. Ajustes de origem/tamanho ficam em `src/config/hazardAnimations.ts`.

O jato tem uma região de dano de **90 × 118 px**, acima do corpo. Na folha, isso corresponde aproximadamente a x=56–200, y=0–154. Mantenha o jato visível cobrindo essa área durante os quadros ativos. A água desenhada pelo jogo é substituída pela animação warn quando ela está disponível; sem warn, permanece o efeito provisório. Entregue idle junto com warn.

### Abelhas: travessia com aviso

Sete abelhas atravessam os saltos nos trechos 5, 12, 19, 26, 33, 40 e 46. Cada uma fica 1800 ms na lateral, avisa por 900 ms com **!**, seta e uma linha pontilhada, e cruza o caminho em 2500 ms. No próximo ciclo, volta pelo outro lado. O movimento é previsível e usa o mesmo cálculo no jogo e na validação do servidor. Os checkpoints e a plataforma final ficam fora da região de dano.

As animações fornecidas foram integradas como `bee_idle_sheet.png` e `bee_warn_sheet.png`. **Exceção ao padrão de 256 px:** cada folha da abelha tem **1024 × 1024**, grade 8 × 8, com **60 quadros de 128 × 128**; as últimas quatro células ficam vazias e nunca são reproduzidas. As folhas já têm transparência.

Idle roda a 24 fps. Warn usa os quadros 0–15 durante os 900 ms de aviso, e 16–59 durante os 2500 ms de travessia, retornando ao idle. Esses tempos mantêm o ciclo de colisão anterior. As poses continuam sincronizadas ao pausar. Com movimento reduzido, cada estado exibe uma pose fixa; o deslocamento continua porque faz parte do desafio.

Os originais Full HD foram preservados nas pastas `bee-idle-sheet/` e `bee-warn-sheet/` aqui em `animations/`. **Guarde os originais em `public`, nunca em `dist`: `dist` é recriada a cada build.** O build exclui essas duas pastas de frames e empacota somente as folhas compactas. Vite gera os nomes finais dos PNGs e o carregador usa as URLs correspondentes.

Para remontar as folhas após editar os frames, execute `python3 scripts/pack-bee-sheets.py` na raiz (requer Pillow). O script conserva os 60 quadros e usa um único recorte e escala para ambas as ações, evitando tremor e variação artificial de tamanho. O enquadramento é registrado em `bee-sheets.json`. A abelha olha para a direita e é espelhada pelo jogo. A folha aparece em um quadro de 80 × 80 px, origem (0.5, 0.57); o corpo de colisão permanece 48 × 32 px. Sem folha, a arte estática é usada.

## Personagem Margô

Há uma configuração reservada e uma pasta em `public/assets/margo/`. Coloque ali as três folhas transparentes `margo_idle_sheet.png`, `margo_walk_sheet.png` e `margo_jump_sheet.png`. Depois de reiniciar/buildar, ela passa a aparecer automaticamente no menu. Não há personagem inventado como substituto. Consulte o README daquela pasta para orientação, linha das patas e quadros do salto. A escala final deve ser conferida com a arte real.
