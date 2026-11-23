# Campanha no Google Ads

Objetivo: trazer leitores novos para o site e, sobretudo, subscritores da newsletter. Rascunho de 24 de novembro de 2026; os números de custos são estimativas, sem dados reais.

## Antes de gastar

1. **Newsletter ativa** (Buttondown, ver `docs/publicacao.md`). Sem ela, não há nada que se possa contar além de visitas, e as visitas pagas não rendem anúncios (o AdSense ainda não aprovou o site).
2. **Meio de pagamento** a funcionar na conta do Google Ads. A conta `582-925-5752` mostra o aviso "Nova forma de pagamento obrigatória: não é possível efetuar a cobrança nos seus métodos de pagamento atuais". Só o José o pode corrigir.
3. **Um limite de gasto.** O José fixou **15 euros no total**: 1 euro por dia durante 15 dias, com data de fim. Se a conta aceitar pagamento manual (pré-pagamento), carregar só 15 euros é um limite que o Google não consegue ultrapassar. Com tão pouco dinheiro, a campanha serve para testar anúncios e palavras-chave (talvez 20 a 40 cliques), não para tirar conclusões de custos.
4. **Medir sem etiquetas.** O site não usa a etiqueta do Google Ads (precisaria de consentimento e de mudar a política de privacidade). Usam-se ligações com UTM e o Cloudflare Web Analytics, e conta-se os subscritores no Buttondown.

## Estrutura

- **Tipo:** campanha de **Pesquisa** (não Smart nem Performance Max, que escondem as palavras-chave), em **modo especialista**.
- **Oferta:** cliques manuais com limite por clique de 0,60 euros, porque sem conversões medidas a otimização automática não tem com que aprender.
- **Localizações (13 cidades universitárias, em inglês):** Oxford e Cambridge (UK); Cambridge MA, New Haven, Princeton, Providence, Ithaca e Hanover NH (Ivy League e vizinhas); Dublin, Edimburgo e Leiden (Europa); Melbourne e Sydney (Austrália). Só a Rede de Pesquisa (sem parceiros nem Display). O assistente atual não tem campo de idioma: depois de criada, definir *Inglês* em Definições da campanha.
- **Público-alvo (observação, não restringe):** Livros, Apreciadores de arte e teatro, Licenciatura.
- **Orçamento:** *total da campanha* de 15 €, de 23 nov a 7 dez 2026.
- **Horário:** todo o dia no início.
- **Com 15 euros, um só grupo de anúncios** (o 2, o do desafio, com as palavras de maior intenção) e as palavras-chave do 1 que sobrarem em correspondência exata. Os dois grupos servem se o orçamento crescer:
  1. **Hábito de leitura** → página inicial `https://bradburychallenge.org/?utm_source=google&utm_medium=cpc&utm_campaign=habito`
  2. **O desafio das mil noites** → `https://bradburychallenge.org/bradbury-challenge/?utm_source=google&utm_medium=cpc&utm_campaign=mil-noites`

## Palavras-chave (correspondência de frase ou exata, nunca ampla)

**Grupo 1: hábito de leitura**
"daily reading challenge", "reading challenge for adults", "read more every day", "daily reading habit", "poem of the day", "short story of the day", "essay of the day", "free short stories to read online", "free poems to read online", "read a poem every day".

**Grupo 2: o desafio**
[1000 nights reading challenge], "read a short story every night", "one poem one essay one short story a day", "poem essay short story every day challenge".

Não licitar o nome e o apelido do autor nem usá-los nos anúncios: o Google deixa licitar marcas como palavras-chave, mas o titular pode pedir que o nome saia do texto dos anúncios, e a Ray Bradbury Literary Works tem marcas registadas.

## Palavras-chave negativas

pdf, download, free pdf, summary, analysis, sparknotes, study guide, essay help, write my essay, essay writing, essay examples, pay, buy, job, jobs, course, class, kids, children, preschool, audiobook, audible, kindle unlimited, fahrenheit, movie, film, quotes, wikipedia, building, hotel, museum.

## Anúncios (Responsive Search Ad, texto em inglês)

Títulos (até 30 caracteres; fixar o 1.º na posição 1):
1. One Poem, Essay & Story Daily
2. A Daily Reading Challenge
3. Read More, One Day at a Time
4. Free Poems, Essays, Stories
5. Your Daily Reading, Chosen
6. Build a Daily Reading Habit
7. 1,000 Nights of Reading
8. Poem, Essay, Short Story
9. Tick Off Each Day's Reading
10. No Sign-Up. Always Free.
11. Great Writing, Every Day
12. Start Your Reading Streak
13. Readings Linked, All Free
14. Daily Literature, No Account
15. Poem of the Day + More

Descrições (até 90 caracteres):
1. Every day, one poem, one essay and one short story, all free to read online. Start today.
2. A reading habit made easy: three chosen texts a day, with a note on each. No sign-up.
3. Poets, essayists and storytellers from Montaigne on. Tick them off and keep your streak.
4. Free daily readings, a growing archive and a glossary of literary devices.

Links de site (título até 25, descrições até 35): The Daily Readings (Today's poem, essay and story / Free, no account needed); Take the Challenge (Read for 1,000 nights / One poem, essay, story a day); Browse the Archive (Every past day, by date / Or by author, A to Z); Literary Devices (146 terms with examples / Learn one new term a day).

Frases de destaque (até 25): Always Free, No Sign-Up, Chosen Daily, Notes on Every Reading, Poems, Essays, Stories, A Growing Archive.

## Como se decide

Ao fim dos 15 dias (15 euros):
- Ver quantos cliques, a que custo por clique, que termos de pesquisa e quantos subscritores.
- **Só vale gastar mais** se o custo por subscritor ficar abaixo de cerca de 3 euros. Acima disso, os anúncios custam mais do que os leitores valem, e os canais gratuitos (Reddit, Pinterest, comunidades de leitura, parcerias) rendem mais.
- Rever em *Termos de pesquisa* o que as pessoas escreveram, juntar negativas e tirar as palavras que gastam sem trazer ninguém.

## Cuidados

- A conta tem uma campanha antiga, "Flash Sale", em pausa, de outro assunto. Não se mexe nela: cria-se uma campanha nova.
- O Google Ads só cobra o que se gasta, até ao orçamento diário (que pode chegar a dobrar num dia, mas o gasto mensal não passa do dobro do orçamento diário vezes os dias). Definir também o limite na página de faturação.
