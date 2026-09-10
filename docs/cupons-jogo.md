# Recompensa de conclusão

O contrato da loja foi conferido em `../artgian-studio/docs/cupons-jogo.md`.
A integração está implementada neste projeto; publicar o código e configurar os
dois servidores são passos separados. Os testes usam um transporte simulado e
não emitem cupons reais.

## Validação e identidade

- `src/shared/simulation.ts` contém as regras de jogo, executadas em passos fixos
  de 60 Hz tanto no navegador quanto no servidor. Inclui plataformas móveis,
  temporárias, impulso, ritmo, obstáculos, gravidade, checkpoints, quedas e vidas.
  Phaser desenha o estado previsto; não executa uma segunda física de gameplay.
- O navegador envia somente lotes sequenciados de até 120 comandos `{axis, jump}`.
  O backend parte do estado inicial, reproduz os comandos e confirma a vitória
  pela colisão com a plataforma final, com vidas restantes. Não existe endpoint
  que aceite `won`, posição, vidas, `playerId` ou `completionId` como prova.
- Não há login. Na primeira visita, o backend cria um UUID de jogador anônimo e
  uma sessão aleatória no D1. O navegador recebe apenas um cookie HttpOnly,
  SameSite=Strict e Secure em HTTPS, válido por 30 dias; o banco guarda o hash
  do token. Recargas reutilizam a sessão e o jogador originais.
- Partidas e recompensas pertencem ao jogador da sessão. IDs enviados pelo cliente
  e headers de identidade não substituem essa associação. Toda mutação exige
  Origin igual ao do jogo; a vitória é validada pelas regras compartilhadas.
- Apagar os cookies, trocar de navegador ou deixar a sessão expirar cria outro
  jogador anônimo. Sem conta, não há recuperação da recompensa entre dispositivos.
- O usuário escolhe personagem e fase, joga e recebe o cupom ao concluir. Se o
  backend estiver inacessível no início, a partida avisa que não poderá emitir cupom.
- Lotes fora de ordem, alterados, adiantados em relação ao relógio do servidor,
  ou de partidas com mais de 30 minutos são rejeitados. Repetições idênticas do
  último lote retornam a confirmação já salva. Uma troca de versão das regras
  encerra a elegibilidade de partidas antigas em andamento.

Isso comprova uma execução válida das regras, não a presença de uma pessoa:
automação que envie comandos válidos ainda pode jogar. Os limites por jogador
anônimo e o limite global da loja continuam aplicáveis; sem login, o limite por
jogador não identifica a mesma pessoa após a exclusão dos cookies.

## Persistência e emissão

O D1 guarda jogadores, sessões, estado de partidas e conclusões. A criação da
conclusão acontece na mesma transação que confirma a vitória. Cada conclusão tem
um UUID, uma chave `conclusao-<UUID>` e os bytes originais do corpo
`{playerId, completionId}`, definidos no servidor e imutáveis nas tentativas.

`POST /api/game/rewards/:completionId` valida sessão anônima e propriedade e chama,
exclusivamente no backend, `POST https://www.artgian.com.br/api/coupons/game`.
Envia Bearer com o segredo, JSON e Idempotency-Key; não encaminha Origin,
cookies nem headers do navegador. Redirecionamentos do upstream são rejeitados: a chamada usa `redirect: "manual"`
e trata respostas 3xx sem segui-las. O runtime Workers rejeita `redirect: "error"`
antes de enviar a requisição.

- Timeout de 8 segundos, erro de rede, resposta inválida ou 5xx: espera progressiva
  persistida, de 1 segundo até 5 minutos, reutilizando a chave e o corpo.
- 429: o próximo instante permitido considera Retry-After (segundos ou data HTTP),
  sem diminuir a espera progressiva. Atualizar a página não antecipa esse instante.
- 200/201: guarda código, percentual, expiração e um prazo calculado conservadoramente
  a partir de `expiresAt` e `expiresInSeconds`. Recarregar consulta esse registro.
- 410 ou expiração local: estado terminal; nenhuma nova emissão para a conclusão.
- Demais erros HTTP: estado de erro persistido, sem repetição automática.
  Corrigir a integração no servidor antes de uma recuperação operacional.
- Uma concessão de processamento de 30 segundos impede tentativas simultâneas.
  Se o processo morrer durante a emissão, após o prazo outro pedido repete a mesma
  operação idempotente. Cada atualização verifica o token da concessão.

O navegador consulta enquanto a tela de recompensa está aberta. Ao fechá-la,
as consultas param; o estado continua no banco. Abrir “Ver meu cupom” na conquista ou “Ver meu último cupom” no menu
retoma a consulta. Recarregar sempre abre a seleção de personagem e fase, sem
redirecionamento automático para a recompensa. Não há job que emita recompensas em segundo plano
quando ninguém estiver consultando.

A tela mostra percentual, código, Copiar cupom, contador e Visitar loja. O link
abre `https://www.artgian.com.br/produtos`; não faz fetch para a loja. O aviso
explica uso único, validade de 30 minutos a partir da emissão e exclusão do frete.

## Desenvolvimento e validação

Use Node 24 ou superior:

```sh
npm install
npm run dev
npm test
npm run build
```

O preview Vite inclui a API local e aplica as migrações a `.local/game.sqlite`.
A sessão anônima funciona também no acesso por IP de rede; não é necessário
simular login. A pasta `.local` e arquivos `.env` estão ignorados pelo Git.

Por padrão, o servidor local **não contata a loja real**. Para uma homologação
explicitamente desejada, injete `COUPON_GAME_API_KEY` e
`GAME_ALLOW_STORE_REQUESTS=1` no ambiente do processo que executa `npm run dev`.
O `.env.example` é apenas referência: nunca inclua valores reais no código,
em variáveis `VITE_*`, no bundle ou no repositório. `npm run preview` mostra
somente os assets compilados; use `npm run dev` para a API local.

Os testes reproduzem rotas vencedoras completas nas três fases e exercitam a API
com SQLite e transporte da loja simulado: fraude, isolamento, recarga, repetição,
concorrência, timeout, 5xx, 429, 410 e expiração. A migração inicial está em
`drizzle/0000_closed_storm.sql`; alterações futuras geram migrações adicionais com
`npm run db:generate`.

## Publicação

1. Publicar este projeto como Worker Sites, preservando seu `project_id`.
   `.openai/hosting.json` declara D1 `DB`; a versão estática anterior não atende
   às rotas `/api/game/*`. O build produz `dist/client`, `dist/server/index.js`
   e `dist/.openai` com a configuração e as migrações. Sites provisiona o binding
   e aplica as migrações antes do upload do Worker.
2. Configurar `COUPON_GAME_API_KEY` como segredo de runtime do servidor do jogo
   e da loja, com o mesmo valor e pelo menos 32 caracteres.
3. Na loja, aplicar a migração `drizzle/0015_gray_manta.sql` e publicar a rota
   conforme o contrato do Artgian Studio. A rota de produção depende disso.
4. Homologar uma partida anônima e uma emissão, recarregar para conferir a
   mesma recompensa e validar o uso no checkout. Não apagar conclusões para
   tentar reemitir cupons. Corrigir incidentes preservando chave, corpo e IDs.

A chave de produção é configurada exclusivamente como segredo de runtime no Sites;
seu valor nunca deve constar neste documento ou no repositório.
