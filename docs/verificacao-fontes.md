# Verificação de fontes (passo 1)

Data: 17 de outubro de 2026. Verificado o `robots.txt` e os termos de utilização de cada fonte da especificação.

## Resumo

| Fonte | robots.txt | Termos | Recolha automática |
|---|---|---|---|
| Lit Hub | Permite as páginas de categoria. Bloqueia `/tag/`, pesquisa. `crawl-delay: 10` | Não foram encontrados termos de utilização publicados | **Permitida** (com 10 s entre pedidos) |
| Library of Short Stories | Permite tudo para `*` | A página "About the Stories" incentiva a ligação a contos e críticas | **Permitida** |
| Poetry Foundation | Permite `/`, mas bloqueia `/search`, `/*/browse` e `/categories/`, que são justamente as páginas de navegação e pesquisa. `crawl-delay: 5` | Proíbem expressamente "bot, crawler, harvester, indexer, robot, spider, scraper or any other automated means" | **Proibida** |
| TLS | `User-agent: *` → `Disallow: /` (só abre a motores de busca e redes de anúncios com nome) | Proíbem a recolha e também "compile, or create a database… (whether manually or through automated means)" | **Proibida**, e mesmo um catálogo manual tem risco |
| New Yorker (Condé Nast) | Permite a página de contribuidores | O User Agreement proíbe "bots… scripts… or any other automated process" para aceder ao serviço | **Proibida** |
| The Public Domain Review | Sem `robots.txt` (404) | Os termos proíbem "spider, crawl, or scrape" | **Proibida** |
| American Literature | Permite para `*`, exceto `/library/`, `/accounts/` e afins | A página de copyright proíbe o acesso automático "for the purpose of content extraction, data harvesting". Diz também "Educators may share links to our pages" | **Proibida** (na prática; a recolha de títulos e URLs cabe em "data harvesting") |
| Granta | O próprio `robots.txt` devolve 403 com verificação anti-bot da Cloudflare, também no browser | Não foi possível ler os termos sem passar a verificação, que não foi contornada | **Bloqueada** |

## Consequências por categoria

Considerando só as fontes com recolha automática permitida:

- **Poemas:** só o Lit Hub. Perdem-se a Poetry Foundation e a Granta.
- **Ensaios:** só o Lit Hub (Craft and Advice), que além disso precisa de filtro para tirar o que não for ensaio. Perdem-se TLS, New Yorker, Granta e Public Domain Review.
- **Contos:** Library of Short Stories e Lit Hub. Perde-se a American Literature.

## Notas adicionais

- Library of Short Stories: os contos estão em domínio público **na Austrália** (é o que o site garante). Isso não equivale a domínio público em Portugal/UE (70 anos após a morte do autor). Interessa para a decisão futura sobre publicar textos integrais.
- Poetry Foundation: os termos impõem também condições a quem cria ligações (não pôr páginas intermédias, não enquadrar o conteúdo, não sugerir apoio da Poetry Foundation). Ligações diretas num novo separador cumprem estas regras.
- Nenhuma página destas fontes foi recolhida para além do `robots.txt`, das páginas iniciais e das páginas de termos.

## Opções para decidir

1. **Catálogo curado à mão** para as fontes que proíbem a recolha automática: o dono do projeto (ou alguém por ele) escolhe os textos no browser e regista título, autor e URL num ficheiro JSON. Os scripts só validam e selecionam. Funciona bem para listas finitas (George Steiner na New Yorker, as 100 da American Literature). Não aconselhado para o TLS, cujos termos proíbem também compilações manuais.
2. **Pedir autorização por escrito** às fontes (Poetry Foundation, Public Domain Review, American Literature, Granta), explicando que o site só guarda título, autor e ligação.
3. **Procurar outras fontes** com termos que permitam a recolha, sobretudo para poemas e ensaios.
4. Avançar só com Lit Hub e Library of Short Stories, aceitando catálogos de poemas e ensaios mais pequenos.

As opções 1 a 3 podem combinar-se.

## Fontes alternativas (verificadas a 17 de outubro de 2026)

Critério: literatura séria, com curadoria editorial ou académica reconhecida. Para cada candidata verifiquei o `robots.txt` e os termos de utilização.

### Recolha automática permitida

| Fonte | Categoria | Porque tem qualidade | Notas |
|---|---|---|---|
| Representative Poetry Online (Universidade de Toronto) | Poemas | Antologia académica do Departamento de Inglês da Universidade de Toronto, com aparato editorial | O copyright cobre a seleção e as notas; guardar só título, autor e ligação |
| Poetry Archive (Reino Unido) | Poemas | Fundado por Andrew Motion; gravações dos próprios poetas | `crawl-delay: 10` |
| Poetry International (Roterdão) | Poemas | Poesia contemporânea de todo o mundo, com traduções para inglês | Sem termos publicados; o `robots.txt` permite tudo |
| New York Review of Books | Ensaios | Referência da crítica literária | Muito do conteúdo é só para assinantes; tem muitas recensões, é preciso filtrar ensaios |
| London Review of Books | Ensaios | Referência da crítica literária | O mesmo que a NYRB |
| Public Books | Ensaios | Escrita por académicos para o público geral | Sem termos publicados |
| n+1 | Ensaios, contos | Revista literária de referência em Nova Iorque | — |
| The Threepenny Review | Ensaios, contos | Revista literária de Berkeley, desde 1980 | Sem termos publicados |
| Wikisource | Poemas, ensaios, contos | Textos em domínio público com fonte identificada | Usar a API com um User-Agent identificável, segundo a Robot Policy da Wikimedia |
| Project Gutenberg | Ensaios, contos (clássicos) | Clássicos em domínio público | Só através dos ficheiros de catálogo oficiais (RDF/CSV). O site em si é "for human users only" |

### Zona cinzenta (não proíbem bots, mas os termos são restritivos quanto ao conteúdo)

| Fonte | Notas |
|---|---|
| The Paris Review | Não proíbe robôs, mas diz que não há direito a "copy, download… any of the information or content". Guardar título e autor é pouco, mas cabe à letra. Recomendo curadoria manual ou pedir autorização |
| The Point | Usa o mesmo modelo de termos da Paris Review |
| Los Angeles Review of Books | Não encontrei termos publicados. O `robots.txt` permite. Convém confirmar por e-mail |
| Poets.org (Academy of American Poets) | Proíbe a recolha "to create unauthorized products or train AI". Um catálogo de ligações pode ser lido como "unauthorized product". Pedir autorização |

### Também proíbem a recolha automática

Aeon ("use any robot… to retrieve"; a Psyche é da mesma editora e deve ter os mesmos termos, mas não os li), Lapham's Quarterly (só abre exceção a motores de busca e a arquivos não comerciais) e Harper's ficam de fora da recolha automática; podem entrar por curadoria manual. A Electric Literature proíbe também processos manuais de indexação, por isso fica totalmente de fora, tal como o TLS.

### Proposta de composição

- **Poemas:** RPO, Poetry Archive, Poetry International e Lit Hub (automático) + Poetry Foundation (curadoria manual).
- **Ensaios:** NYRB, LRB, Public Books, n+1, Threepenny e Lit Hub (automático) + ensaios clássicos via Wikisource/Gutenberg + Steiner na New Yorker e Public Domain Review (curadoria manual).
- **Contos:** Library of Short Stories, Wikisource, n+1, Threepenny e Lit Hub (automático) + as 100 da American Literature (curadoria manual).

## Alterações durante a construção dos catálogos (passo 2)

- **Public Books e n+1**: os termos e o `robots.txt` permitem, mas os servidores respondem 403 a qualquer pedido que se identifique como bot (o mesmo pedido sem identificação passa). Não contornámos o bloqueio. Passam para curadoria manual.
- **The Threepenny Review**: o site não distingue poemas, ensaios e contos de forma fiável (nem na API, nem nas páginas). Seguindo a regra "na dúvida, excluir", fica de fora por agora.
- **Lit Hub, Craft and Advice**: avaliado e posto de parte para os ensaios. São sobretudo textos promocionais de autores sobre os próprios livros e páginas de podcast, abaixo do critério de qualidade. O Lit Hub fica só para poemas e contos.
- **NYRB**: além dos ensaios, publica poemas (forma `article-form-poem`), que entram no catálogo de poemas.
- **Wikisource e Project Gutenberg**: ainda não implementados.
- **London Review of Books**: acrescentada como segunda fonte de ensaios. Cruza a lista "Literature & Criticism" com o índice de cada número (que mostra se o texto é uma recensão) e confirma na página de cada artigo que é um ensaio (`type--essay`). Ficam de fora recensões, poemas, cartas, Short Cuts, contos e textos sobre exposições.
- **Traduções**: mantêm-se os textos traduzidos para inglês, com o tradutor registado no campo `translator` quando a fonte o indica (NYRB, Lit Hub). A Library of Short Stories não indica o tradutor (Chekhov, Maupassant, Kuprin...), por isso, se se decidir aceitar só textos escritos originalmente em inglês, será preciso também uma lista de autores que não escrevem em inglês. A Poetry International já só fornece poemas escritos originalmente em inglês.

## Acesso livre (18 de outubro de 2026)

Regra do dono do projeto: só entram textos de leitura gratuita. A seleção só escolhe textos com
`paywalled: false`; os pagos ou de acesso desconhecido ficam no catálogo mas nunca saem.

O acesso foi verificado na página de cada texto, através do dado estruturado `isAccessibleForFree`
(schema.org), com `npm run check-access`:

| Fonte | Verificados | Gratuitos |
|---|---|---|
| NYRB, poemas | 859 | 859 |
| NYRB, ensaios | 647 | 6 |
| LRB, ensaios | 274 | 0 |

Lit Hub, Library of Short Stories, RPO, Poetry Archive e Poetry International não têm paywall.
A recolha da LRB ficou desligada. **Os ensaios ficam com 6 textos selecionáveis: é preciso encontrar
fontes de ensaios gratuitas antes do lançamento.**

Candidatas verificadas:
- **Los Angeles Review of Books**: gratuita, `robots.txt` permite, sem termos de utilização publicados. Recolha automática possível.
- **JSTOR Daily**: gratuita, mas os termos proíbem programas que descarreguem conteúdo automaticamente. Só com autorização ou curadoria manual.
- **Ensaios clássicos em domínio público na Wikisource** (Montaigne, Bacon, Hazlitt, Lamb, Emerson, Woolf...): gratuitos, recolha automática permitida pela política de robôs da Wikimedia.
- **Curadoria manual**, para sites gratuitos que não permitem recolha: Aeon, The Public Domain Review, Public Books, ensaios da Poetry Foundation.

## Novas fontes de ensaios (19–20 de outubro de 2026)

- **Los Angeles Review of Books** (`src/sources/larb.ts`). Gratuita: o próprio site diz que publica "without a paywall", e as páginas trazem o texto integral. Lê a lista `/articles/essays/all/?page=N` e fica com os ensaios das secções literárias (`literary-criticism`, `memoir-essay`, `poetry`, `fiction`, `biography-autobiography`). Saem os ensaios de outras secções, os antigos sem secção (cerca de 2011–2013), os poemas publicados como "Autor’s ‘Título’", os excertos de livros, as conversas, entrevistas e mesas-redondas e, por verificação do texto de cada página, os poemas que a LARB etiqueta como "Essays" (exige-se prosa: pelo menos 8 parágrafos longos e 1000 palavras).
- **Wikisource, ensaios clássicos** (`src/sources/wikisource.ts` e `wikisource-essays.json`). Lista curada de 327 ensaios: Montaigne (tradução de Cotton), Bacon, Hazlitt, Chesterton, Emerson, Woolf, Stevenson, Pater e Wilde, mais textos isolados de De Quincey, Thoreau ("Resistance to Civil Government"; "Walking" não existe na Wikisource), Poe, George Eliot, Twain, Swift e Shelley. Só autores mortos há mais de 70 anos (domínio público também na UE; há um teste que o garante). A recolha usa só as páginas `/wiki/`, permitidas pelo `robots.txt`; a API está fechada a robôs genéricos.
  - A política de User-Agent da Wikimedia pede um contacto no User-Agent. Antes de pôr a tarefa diária a correr, definir `BRADBURY_CONTACT_URL` (por exemplo, o endereço do repositório ou do site).
- **Ficaram de fora**: Matthew Arnold e Henry James (sem as coletâneas na Wikisource) e Charles Lamb (só digitalizações por rever).
