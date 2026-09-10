# Refinamento da Oficina

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

Oficina recebe um novo fundo, parallax em duas velocidades, luzes pulsantes,
partículas ambiente e efeitos discretos de salto/aterrissagem. A preferência
por movimento reduzido desativa esses movimentos decorativos.
HUD e controles são compartilhados. A impressora tem 20% da largura e altura
anteriores (redução de 80% em ambas as dimensões), no canto superior direito,
com porcentagem e barra de impressão. A física e os percursos não mudaram.

## Verificação

Build TypeScript/Vite e suíte automatizada de regras, assets e encaixe geométrico
em telas pequenas, altas, landscape, áreas seguras e barra do navegador.
Não foi realizado teste em aparelho Galaxy físico nem teste de interação no navegador
nesta alteração. Arquivos brutos de animação e cópias soltas de sheets ficam no
checkout, fora da distribuição.
