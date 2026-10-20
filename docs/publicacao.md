# Publicação e tarefa diária

## Como funciona

```
00:05 em Lisboa   GitHub Actions "Leituras do dia"
                  └─ npm run schedule  → acrescenta o dia a data/schedule.json
                  └─ commit no main    → o alojamento deteta o push e faz o build e o deploy

03:17 UTC         GitHub Actions "Catálogos"
                  └─ npm run collect   → cada fonte só é recolhida quando passa o seu intervalo
                  └─ npm run validate
                  └─ commit no main    → novo deploy (por exemplo, avisos de textos indisponíveis)

Cada push com código   GitHub Actions "Testes": tipos, testes e build
```

- **Hora de verão:** o GitHub só aceita horários em UTC. A "Leituras do dia" corre às 23:05 e às 00:05 UTC (00:05 em Lisboa no verão e no inverno, respetivamente) e ainda às 01:35 UTC, como reserva. A seleção é idempotente: as execuções que não calham depois da meia-noite de Lisboa não fazem nada.
- **Credenciais:** os workflows usam o `GITHUB_TOKEN` automático, com `permissions: contents: write`. Não é preciso nenhum token pessoal. O deploy não precisa de segredos, porque o alojamento lê o repositório através da sua própria ligação ao GitHub.
- **Recolhas longas:** a recolha dos catálogos está num workflow à parte, para nunca atrasar as leituras do dia (a do Poetry Archive, por exemplo, leva mais de uma hora por causa do crawl-delay de 10 segundos).
- **Fontes com erro:** ficam registadas em `data/state/sources.json` e aparecem como avisos na execução do workflow "Catálogos". Uma fonte que falhe não impede as outras nem a seleção do dia.

## Passos para pôr o site no ar

### 1. Repositório no GitHub

Enviar o código para o repositório do projeto (o ramo de produção é `main`).

### 2. Variáveis do repositório

Em *Settings → Secrets and variables → Actions → Variables*:

| Variável | Obrigatória | Para quê |
|---|---|---|
| `BRADBURY_START_DATE` | Sim, para começar | Primeiro dia de leituras, por exemplo `2026-11-01`. Enquanto não existir, a tarefa diária não seleciona nada. |
| `BRADBURY_CONTACT_URL` | Não | Contacto no User-Agent da recolha (a Wikimedia pede-o). Por omissão, o endereço do repositório. Com o site no ar, usar `https://bradburychallenge.org/contact` (página do passo 7). |
| `BRADBURY_SEED` | Não | Seed da ordem das leituras. **Não mudar depois do lançamento.** |

Em *Settings → Actions → General → Workflow permissions*, confirmar que os workflows podem escrever no repositório. Os workflows pedem `contents: write`; uma política da organização pode impedi-lo.

### 3. Alojamento: Cloudflare Pages (recomendado)

Recomendo o Cloudflare Pages: o plano gratuito permite uso comercial (o site terá anúncios), não tem limite de tráfego e tem análise de tráfego sem cookies (Cloudflare Web Analytics), que a especificação prevê. O plano gratuito da Vercel é só para uso não comercial; a Netlify também serve.

Em *Workers & Pages → Create → Pages → Connect to Git*:

1. Escolher o repositório e o ramo de produção `main`.
2. Framework: **Astro**. Build command: `npm run build`. Build output directory: `dist`.
3. Variáveis de ambiente (produção):
   - `NODE_VERSION` = `22` (o ficheiro `.node-version` também o indica);
   - `BRADBURY_SITE_URL` é opcional: por omissão é `https://bradburychallenge.org`, usado nos URLs absolutos e no Open Graph.
4. Guardar e fazer o primeiro deploy.

A partir daí, cada push no `main`, incluindo o commit diário do bot, gera um novo deploy.

### 4. Domínio: bradburychallenge.org

Registado no Cloudflare Registrar a 20 de outubro de 2026, por dois anos (até 20 de outubro de 2028). Os servidores DNS já são os do Cloudflare (`lola.ns.cloudflare.com` e `pedro.ns.cloudflare.com`); falta ligá-lo ao projeto do Pages. (O `bradburychallenge.com` pertence a outra pessoa e não está à venda.)

1. No projeto do Pages: *Custom domains → Set up a custom domain* → `bradburychallenge.org`. Como o domínio está no mesmo Cloudflare, o registo DNS é criado automaticamente. Repetir para `www.bradburychallenge.org`.
2. Redirecionar o `www` para o endereço sem `www`: no domínio, *Rules → Redirect Rules*, modelo "Redirect from WWW to root". Os `canonical` das páginas já apontam para o endereço sem `www`.
3. Esperar uns minutos pelo certificado HTTPS e abrir `https://bradburychallenge.org`.
4. Em *Domain Registration → Manage Domains*, confirmar que a renovação automática está ligada e que o cartão de pagamento é válido.
5. **Endereço de contacto** (passo 7 e pedido ao AdSense): com o Cloudflare Email Routing (gratuito) cria-se, por exemplo, `contact@bradburychallenge.org`, que reencaminha para o e-mail pessoal.

### 5. Verificar

1. Em *Actions → Leituras do dia → Run workflow*, correr a seleção à mão (com `BRADBURY_START_DATE` igual ou anterior a hoje).
2. Confirmar que apareceu um commit "Leituras de AAAA-MM-DD" e que o Cloudflare fez um novo deploy.
3. Abrir o site: a página Hoje deve mostrar as leituras do dia.

## Notas

- O GitHub pode atrasar execuções agendadas em alturas de muito tráfego. Se a seleção de hoje ainda não estiver publicada, a página Hoje mostra a de ontem com um aviso, e a reserva das 01:35 UTC volta a tentar.
- Num repositório público, o GitHub desativa os workflows agendados ao fim de 60 dias sem atividade. Os commits diários evitam isso.
- Para gerar à mão a seleção até um dia (nunca futuro): `npm run schedule -- --date AAAA-MM-DD`.
