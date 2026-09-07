# Direção de arte — revisão de fidelidade

Assets gerados com a ferramenta integrada ImageGen a partir da referência fornecida, em dois pedidos:

1. **workshop-depth.png** — camada distante vertical 9:16 de oficina de impressão 3D, iluminação cinematográfica azul/dourada, prateleiras, bobinas, plantas e monitores. Sem personagem, plataformas, HUD, chapéu, cabeçote ou mesa. Centro levemente desfocado para separar profundidade e gameplay.
2. **workshop-atlas.png** — atlas 4 × 3 com plataformas industriais, espinhos, plataforma listrada, pistão de impulso, cabeçote 3D, mesa de impressão, chaveiro de chapéu marrom com contorno creme, carretel preto com bordas douradas, coração vermelho com contorno azul, ventilador, coluna e prateleira com planta/caneca. Metal escuro, detalhes mecânicos e neon azul seguindo a referência.

As imagens originais ficam em `public/assets/`. O atlas foi entregue em RGB com fundo quadriculado claro, apesar do pedido de transparência. O carregador `src/art/atlas.ts` extrai os objetos e remove apenas o fundo neutro conectado às bordas. O arquivo original permanece intacto. Não foi usada a composição inteira da referência como fundo jogável.

Personagem: folha de poses fornecida, com transparência preservada e texturas de apresentação em maior resolução. O corpo de colisão foi mantido separado da escala visual.
