# Validação visual e funcional

## Rodadas realizadas

1. **Composição**: comparado o protótipo com a referência em viewport vertical. Removido cabeçalho de 120 px, ampliado o personagem sem ampliar o corpo de colisão, movida a impressora para o terço superior e ajustada a base à esquerda.
2. **Cores e iluminação**: integrados fundo de oficina e atlas próprios. Metal escuro, neon ciano, contornos dourados, bobinas reais estilizadas e iluminação quente/fria.
3. **Elementos principais**: corrigidos escala, alpha e nitidez do personagem; plataformas com acabamento mecânico, coração 3D, chapéu com contorno creme, mesa e cabeçote independentes. Obstáculos preservam colisões.
4. **Profundidade**: capturados início e checkpoint central; a oficina move-se lentamente, enquanto trilhos, placas, props, plataformas e personagem ocupam planos diferentes. Fundo ampliado para não abrir faixas vazias no topo durante a subida.
5. **Polimento**: retirados textos duplicados da base; completadas placas do topo, pôster com chapéu, escala dos colecionáveis e tela de vitória. Capturas finais de início, meio e topo exportadas pelo framebuffer do Phaser em 540×960.

## Comparação com a referência

- **Muito semelhante**: linguagem e materiais das plataformas; cabeçote, chapéu e mesa; carretéis; corações; contraste azul/dourado; trilhos, ventilador, plantas/caneca e placas integradas ao ambiente.
- **Muito semelhante no universo visual, com diferenças de pose**: personagem fornecido, agora maior e com transparência preservada.
- **Parcialmente semelhante por exigência de gameplay**: disposição muda durante a escalada; a peça está ausente/parcial no início e só fica pronta no final. A referência representa um instante quase concluído. Animações usam poses, não um rig 3D contínuo.

## Percurso real no navegador

A rota de teste aciona os mesmos controles de deslocamento e salto. Não altera vidas, não desativa perigos e não teletransporta. Todas as plataformas foram alcançadas e a tela IMPRESSÃO CONCLUÍDA foi acionada, com **3 vidas e 14/15 filamentos**. Quedas e danos também foram observados nas tentativas anteriores, incluindo game over e reinício.

TypeScript, build de produção e os três testes automatizados passaram. Console sem erros JavaScript na travessia concluída. O módulo de teste é exclusivo do ambiente de desenvolvimento.

A travessia final após o polimento também concluiu a fase: **14/15 filamentos e 1 vida restante**, incluindo duas recuperações no último checkpoint. Capturas em 540×960: `final-start.png`, `final-middle.png`, `final-top.png`. `comparison.png` coloca a referência ao lado dessas três capturas.
