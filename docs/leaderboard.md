# Leaderboard

Tabela opcional, em `/leaderboard/`, com os leitores que entraram: **dias completos desta semana** (de segunda a
domingo) e **sequências atuais** (dias seguidos, com um dia de descanso por semana, a mesma regra das estatísticas do
site). Mostra o top 10 de cada.

## Como funciona

- **Entrar é opcional.** O leitor escolhe um nome (2 a 24 letras ou números, sem ligações) e marca a caixa de
  consentimento. O browser gera uma chave aleatória e guarda-a em `bradbury:leaderboard`; o servidor só guarda o hash
  SHA-256 dessa chave.
- **Um dia conta** quando o leitor marca as três leituras de hoje, no próprio dia. O browser avisa o servidor, que usa a
  sua própria data de Lisboa: não se podem acrescentar dias passados nem futuros. A contagem começa no dia em que o
  leitor entra.
- **Batota:** as marcações são declaradas pelo leitor; o máximo que alguém consegue é marcar um dia por dia, que é o
  mesmo que um leitor honesto. Nomes únicos (sem distinguir maiúsculas nem acentos) e uma lista curta de palavras
  proibidas.
- **Trazer a sequência que já tinha (só até 7 de dezembro de 2026).** Na primeira entrada, o browser envia a
  sequência que calculou a partir das marcações "Read" (até ontem) e o último dia completo. O servidor aceita-a se
  ainda estiver viva (último dia ontem, ou anteontem com ontem como descanso), limita-a ao número de dias desde o
  primeiro dia do site (20 de outubro de 2026) e guarda-a em `imported`. Nas tabelas aparece com "*" ("includes days
  read before joining"); a marca desaparece se essa sequência recomeçar. Mudar de nome não volta a importar. A tabela
  da semana não muda: só conta dias marcados depois de entrar. Datas em `src/site/leaderboard.ts`
  (`SITE_FIRST_DAY`, `LEADERBOARD_OPENED`, `IMPORT_UNTIL`). Dá para fazer batota uma vez (marcar dias passados no
  arquivo antes de entrar); é o preço de reconhecer quem já vinha a ler.
- **Sair** ("Leave and delete my data") apaga o nome e os dias de imediato.
- **Custo:** plano gratuito da Cloudflare (Pages Functions: 100 000 pedidos por dia; D1: 5 milhões de linhas lidas e
  100 000 escritas por dia). A tabela pública fica em cache 2 minutos.

Código: `src/site/leaderboard.ts` (regras), `src/site/leaderboard-server.ts` (API), `functions/api/leaderboard/`
(rotas das Pages Functions), `src/site/leaderboard-client.ts` (browser), `src/pages/leaderboard.astro` (página),
`migrations/0001_leaderboard.sql` (tabelas). Testes em `tests/leaderboard*.test.ts`.

## Ativar (uma vez, no painel da Cloudflare)

1. **Criar a base de dados.** *Storage & databases → D1 SQL database → Create* com o nome `bradbury-leaderboard`
   (em *Data location*, escolher *Specify jurisdiction → The European Union*: os dados ficam só na UE).
2. **Criar as tabelas.** Na base criada, separador *Console*: colar o conteúdo de `migrations/0001_leaderboard.sql` e
   executar; depois o de `migrations/0002_imported.sql` (cada migração só uma vez, por ordem).
3. **Ligar a base ao site.** *Workers & Pages →* projeto do site *→ Settings → Bindings → Add → D1 database*:
   - Variable name: `LEADERBOARD_DB`
   - D1 database: `bradbury-leaderboard`
   - Ambiente: **Production** (e Preview, se quiser testar nos deploys de pré-visualização).
4. **Mostrar a leaderboard.** *Settings → Variables and secrets*: criar `BRADBURY_LEADERBOARD` = `1` (Production).
5. **Novo deploy** (*Deployments → Retry deployment*, ou o próximo commit). Aparece a ligação "Leaderboard" no rodapé.

Não criar `wrangler.toml` no repositório: se existir, passa a mandar nas definições do projeto e as ligações do painel
deixam de valer.

Sem a ligação `LEADERBOARD_DB`, a API responde 503 e a página diz que a leaderboard não está disponível. Sem
`BRADBURY_LEADERBOARD=1`, a página não aparece no rodapé nem no sitemap e diz "not open yet".

## Moderação e pedidos de apagamento

Na consola da base D1:

```sql
-- Ver os leitores
SELECT name, streak, best, last_day, hidden, created FROM readers ORDER BY created DESC;

-- Esconder um nome (deixa de aparecer nas tabelas; o leitor pode mudar de nome)
UPDATE readers SET hidden = 1 WHERE name = 'Nome a esconder';

-- Apagar um leitor a pedido (RGPD)
DELETE FROM checkins WHERE reader_id = (SELECT id FROM readers WHERE name = 'Nome');
DELETE FROM readers WHERE name = 'Nome';
```

## Testar localmente

```bash
BRADBURY_LEADERBOARD=1 npm run build
npx wrangler pages dev dist --d1 LEADERBOARD_DB
```

Na primeira vez, abrir `http://localhost:8788/api/leaderboard` (cria a base local, ainda sem tabelas, e dá erro 500) e
depois criar as tabelas no ficheiro da base local:

```bash
node -e "const {DatabaseSync}=require('node:sqlite');const f=require('fs');const p=f.readdirSync('.wrangler/state/v3/d1/miniflare-D1DatabaseObject').find(n=>n!=='metadata.sqlite'&&n.endsWith('.sqlite'));const db=new DatabaseSync('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/'+p);for(const m of f.readdirSync('migrations').sort())db.exec(f.readFileSync('migrations/'+m,'utf8'))"
```
