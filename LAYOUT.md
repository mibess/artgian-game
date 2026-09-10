# Refinamento das três fases

## Tailwind CSS

Adotado Tailwind CSS 4.3.3 e plugin oficial `@tailwindcss/vite` 4.3.3,
confirmados pelo canal `latest` do npm em 10/09/2026.
É adequado para a camada HTML: botões reais, foco de teclado, estados de toque,
espaçamento e superfície responsiva. Não estiliza o canvas do Phaser; HUD,
impressora e efeitos continuam no motor do jogo. CSS gerado no build, sem CDN
ou runtime de Tailwind. Navegadores modernos são necessários (Safari 16.4+,
Chrome 111+, Firefox 128+ conforme documentação do Tailwind).

Referências: https://tailwindcss.com/docs/installation/using-vite e
https://tailwindcss.com/docs/compatibility .

## Encaixe e controles

Mantida a resolução lógica 540 × 960 e a física. A superfície agora cabe no
`visualViewport` depois de descontar `safe-area-inset-*` e margens. Alterações
da barra do navegador e rotação recalculam o encaixe e atualizam a escala do Phaser.
Não há expansão que recorte o canvas. Em landscape curto, os controles ficam
numa faixa externa reservada, com alvos de toque de pelo menos 44 px.
Direcionais e salto têm captura de ponteiros independentes; cancelamento,
perda de captura, blur e encerramento da cena limpam entradas.

## Escopo visual

Cada fase agora tem três espaços distintos, montados na vertical sem espelhamento
ou repetição. A Oficina parte das máquinas no piso, passa pelo armazenamento e
chega às vigas e à ventilação; Casa vai da sala às janelas altas e ao sótão;
Estúdio passa da sala de gravação aos painéis/equipamentos e à iluminação do teto.

As faixas de 960 px se sobrepõem por 240 px, com alpha gradual na junção.
O ambiente completo tem 2400 px; o deslocamento da câmera é mapeado para seus
1440 px de subida. O piso coincide com a vista inicial e o teto com a vista final.
A composição das faixas acontece uma vez no carregamento, em texturas de 640 × 960;
as fontes são liberadas após a composição. As imagens originais ficam intactas.

Há objetos recortados independentes nas margens, em planos de parallax 0,48 e 0,72,
além das luzes a 0,45 e das partículas existentes. Ventiladores giram e objetos
suspensos oscilam suavemente. Elementos decorativos ficam atrás da jogabilidade,
sem colisão. Os planos seguem a posição real da câmera, inclusive nas quedas e
no retorno aos checkpoints. Movimento reduzido desativa a oscilação e aproxima
as velocidades das camadas, preservando a revelação de novos ambientes na subida.
As miniaturas de seleção mantêm a arte aprovada anteriormente.
HUD e controles são compartilhados. A impressora tem 20% da largura e altura
anteriores (redução de 80% em ambas as dimensões), no canto superior direito,
com porcentagem e barra de impressão. A física e os percursos não mudaram.

## Verificação

Build TypeScript/Vite e suíte automatizada de regras, assets e encaixe geométrico
em telas pequenas, altas, landscape, áreas seguras e barra do navegador.
Não foi realizado teste em aparelho Galaxy físico nem teste de interação no navegador
nesta alteração. Arquivos brutos de animação e cópias soltas de sheets ficam no
checkout, fora da distribuição.
