# Bradbury Challenge — especificação para desenvolvimento

## 1. Objetivo

Criar o **Bradbury Challenge**, um site público em que, todos os dias, o leitor encontra três sugestões de leitura:

- um **poema**;
- um **ensaio**;
- um **conto** (short story).

A página inicial mostra as leituras de hoje e há um separador com o arquivo dos dias anteriores. O site regista localmente o que o leitor já leu. Não tem data de fim: todos os dias passa a haver uma nova seleção, gerada automaticamente.

O site deve vir a gerar rendimento através de anúncios (Google AdSense ou equivalente). Por isso, desde o início tem de cumprir os requisitos de aprovação para anúncios, de privacidade (RGPD) e de direitos de autor descritos abaixo.

A interface fica em português de Portugal. Os textos sugeridos estão em inglês, no idioma original.

## 1A. Nome, repositório e credenciais

- **Nome do site:** Bradbury Challenge. Usar este nome no título das páginas, no cabeçalho, nos metadados e no `package.json` (`bradbury-challenge`).
- **Repositório:** já existe um repositório no GitHub criado pelo dono do projeto. Antes de começar, perguntar o endereço (`utilizador/repositório`), caso ainda não esteja configurado na sessão.
- **Credenciais — regras obrigatórias:**
  - Nunca escrever tokens, palavras-passe ou chaves em ficheiros do repositório, incluindo este documento, código, ficheiros `.env` versionados ou mensagens de commit.
  - Para trabalhar no repositório a partir do Claude Code, usar a autenticação já configurada na máquina (`gh auth login` ou a ligação do Claude Code ao GitHub). Se for preciso um token, pedi-lo ao dono do projeto no momento e usá-lo apenas como variável de ambiente local, sem o guardar.
  - Na tarefa agendada do GitHub Actions, usar o `GITHUB_TOKEN` automático do próprio workflow, com `permissions: contents: write`. Não é preciso nenhum token pessoal para fazer commit do `schedule.json`.
  - Qualquer outro segredo (por exemplo, chave de API para gerar as notas editoriais, tokens do serviço de alojamento) fica em **GitHub Secrets** e é lido no workflow através de `${{ secrets.NOME }}`.
  - Criar um `.gitignore` que exclua `.env`, `.env.*` e ficheiros de credenciais desde o primeiro commit.

## 2. Regra fundamental: direitos de autor

O site **não reproduz** o texto integral de poemas, ensaios ou contos protegidos por direitos de autor. Para cada sugestão guarda e mostra apenas:

- título;
- autor;
- fonte (nome do site);
- ligação para o texto original;
- uma nota editorial original, escrita para o site (ver secção 8).

Exceção possível: contos comprovadamente em domínio público, por exemplo os da Library of Short Stories ou da American Literature. Mesmo para esses, a primeira versão deve usar apenas ligações. A publicação de textos integrais fica para uma fase posterior, depois de confirmado o estatuto de cada texto.

Antes de implementar a recolha de dados, verificar o `robots.txt` e os termos de utilização de cada fonte. Respeitar o que proibirem. A recolha deve ser feita com pouca frequência e com um User-Agent identificável. Se alguma fonte proibir a recolha automática, parar e avisar o dono do projeto antes de continuar.

## 3. Fontes

### Poemas
- Poetry Foundation: https://www.poetryfoundation.org
  - Não usar o "Poem of the Day" como fonte diária, porque não é possível saber antecipadamente qual será o poema.
  - Construir um catálogo próprio de poemas a partir das páginas de navegação e pesquisa do site.
- Granta, poesia: https://granta.com/explore/?cat=poetry
- Lit Hub, poemas: https://lithub.com/category/fictionandpoetry/poem/
- Para cada poema, guardar título, autor e URL canónico.

### Ensaios
- TLS, ensaios de literatura: https://www.the-tls.com/categories/literature/essays
- New Yorker, textos de George Steiner: https://www.newyorker.com/contributors/george-steiner
  - Esta página tem um número finito de textos.
- Granta, ensaios e memórias: https://granta.com/explore/?cat=essays-and-memoir
- The Public Domain Review, ensaios: https://publicdomainreview.org/essays/
- Lit Hub, ofício e conselhos: https://lithub.com/category/craftandcriticism/craft-and-advice/
- Alguns destes textos estão atrás de paywall, sobretudo no TLS, na New Yorker e na Granta. Isso é aceitável, porque o site só mostra a ligação. Quando for possível detetar, marcar no catálogo se o texto é só para assinantes e mostrar essa informação ao leitor.
- Na secção Craft and Advice do Lit Hub há também listas e textos curtos que não são ensaios. Filtrar o catálogo para manter só textos com caráter de ensaio. Na dúvida, excluir.

### Contos
- Library of Short Stories: https://www.libraryofshortstories.com
- American Literature, 100 Great Short Stories: https://americanliterature.com/100-great-short-stories/
- Lit Hub, contos: https://lithub.com/category/fictionandpoetry/short-story/
  - Alguns destes textos podem ser excertos de livros e não contos completos. Quando for possível identificar, excluí-los do catálogo.

### Novas fontes
- Ao acrescentar uma fonte, criar um módulo de recolha próprio para ela, com a mesma interface dos outros.
- Uma fonte que falhe (página alterada, bloqueio, erro) não pode impedir a seleção do dia: a seleção usa as restantes fontes da categoria e o erro fica registado nos logs.

## 4. Lógica de seleção diária

- **Data de início:** a data de lançamento do site. Deve estar definida numa variável de configuração.
- Cada dia, a partir da data de início, tem exatamente um poema, um ensaio e um conto.
- Um texto não se repete enquanto houver textos por usar no catálogo da categoria.
- A seleção de cada dia, depois de feita, **fica fixa** e é guardada. Nunca é recalculada, mesmo que o catálogo mude.
- **Ordem de seleção:** pseudo-aleatória mas determinística, com uma seed configurável. Alternar fontes dentro da mesma categoria sempre que possível, sem repetir a mesma fonte em dois dias seguidos quando houver alternativa. Tentar uma distribuição equilibrada entre fontes ao longo do tempo, proporcional ao tamanho de cada catálogo.
- **Catálogo esgotado numa categoria:**
  1. tentar atualizar o catálogo a partir das fontes;
  2. se não houver textos novos, reiniciar o ciclo dessa categoria, voltando a usar os textos mais antigos, nunca os dos últimos 365 dias;
  3. registar um aviso nos logs.
- Os dias futuros **não** são gerados nem revelados antecipadamente.

## 5. Arquitetura recomendada

Manter tudo simples e barato. Usar o seguinte, salvo motivo forte em contrário:

- **Site estático** gerado com Astro, alojado em Cloudflare Pages, Netlify ou Vercel.
- **Dados em ficheiros JSON** no próprio repositório. Não usar base de dados na primeira versão.
  - `data/catalog/poems.json`, `data/catalog/essays.json`, `data/catalog/stories.json`, com os catálogos.
  - `data/schedule.json`, com a seleção fixa de cada dia, organizada por data ISO (`2026-10-17`).
- **Tarefa agendada diária** em GitHub Actions, por volta das 00:05 na hora de Lisboa, com atenção à mudança de hora. A tarefa:
  1. atualiza os catálogos, no máximo uma vez por semana para cada fonte;
  2. acrescenta a seleção do novo dia ao `schedule.json`;
  3. faz commit e dispara um novo deploy.
- Scripts de recolha e seleção em Node.js/TypeScript, com testes.
- Comando manual para gerar a seleção de um dia específico e para validar os catálogos (URLs ativos, sem duplicados).


## 6. Páginas e URLs

- `/` — página inicial com as leituras de hoje. É a página principal do site.
- `/arquivo` — separador com as leituras dos dias anteriores.
- `/AAAA/MM/DD` — página própria de cada dia, com as três leituras desse dia. É importante para SEO e para partilha. A página de hoje existe também neste formato.
- `/sobre` — o que é o site e como são escolhidos os textos.
- `/privacidade` — política de privacidade, obrigatória para os anúncios.
- `/cookies` — política de cookies.
- `/contacto`.
- `sitemap.xml` e `robots.txt` gerados automaticamente.
- Metadados Open Graph em cada página de dia, para pré-visualização em redes sociais.

## 7. Interface

Não há calendário em grelha. O site tem duas vistas principais, acessíveis por dois separadores no topo de todas as páginas: **Hoje** e **Arquivo**.

### Hoje (página inicial)
- Abre diretamente nas leituras do dia. O "hoje" é calculado no fuso horário Europe/Lisbon.
- Título com o dia da semana e a data, por exemplo "Sábado, 17 de outubro de 2026".
- Linha de contexto, por exemplo "Dia 32 de leituras".
- Três cartões, um por categoria, por esta ordem: Poema, Ensaio, Conto. Cada cartão tem:
  - etiqueta colorida com a categoria;
  - título do texto, como ligação para o original, a abrir num novo separador com `rel="noopener"`;
  - autor e fonte;
  - indicação "Só para assinantes", quando aplicável;
  - nota editorial curta (secção 8);
  - caixa "Lido".
- Notas ou avisos, quando houver. Por exemplo, um aviso se um texto deixou de estar disponível.
- Ligação discreta para as leituras de ontem e para o Arquivo.
- Se a seleção de hoje ainda não estiver disponível (por exemplo, nos primeiros minutos do dia, antes do deploy), mostrar a do dia anterior com uma nota a indicar que é a de ontem.

### Arquivo
- Lista dos dias anteriores, do mais recente para o mais antigo, agrupada por mês ("Outubro de 2026", "Setembro de 2026", ...).
- Cada dia aparece numa linha compacta com:
  - a data por extenso;
  - os títulos das três leituras, cada um com a etiqueta colorida da categoria;
  - o indicador de leitura (ver abaixo).
- Tocar num dia abre a página desse dia (`/AAAA/MM/DD`).
- Paginação simples ou botão "Ver mais", para a página não crescer indefinidamente. Por exemplo, 30 dias de cada vez.
- Filtro por categoria (Poemas, Ensaios, Contos) e pesquisa simples por título ou autor. Pode ficar para uma segunda fase.

### Página de cada dia
- Mesmo conteúdo e aspeto da página Hoje, com a data desse dia.
- Botões "Dia anterior" e "Dia seguinte", inativos nos limites. Não há ligação para dias futuros.

### Cores das categorias
- Cada categoria (Poema, Ensaio, Conto) tem a sua cor, usada nas etiquetas. Paleta sóbria, com contraste suficiente no modo claro e no modo escuro.
- A cor nunca é a única forma de identificar a categoria: a etiqueta tem sempre o nome escrito.

### Marcações de leitura
- As caixas "Lido" ficam guardadas em `localStorage`, com leitura e escrita protegidas por `try/catch`. O site tem de funcionar normalmente se o armazenamento falhar.
- No Arquivo, cada dia mostra um pequeno indicador:
  - cheio, se os três textos foram lidos;
  - só com o contorno, se foi lida apenas uma parte;
  - nada, se não foi lido nenhum.

### Requisito técnico obrigatório
- O texto de cada linha (título, autor, nota) tem de ficar dentro de **um único elemento** e fluir normalmente ao lado de etiquetas ou ícones.
- Num projeto anterior houve um erro em que cada palavra aparecia numa linha diferente. Não usar flex ou grid sobre texto partido em vários elementos.
- Testar com títulos e notas longos, em ecrã estreito.

## 8. Conteúdo original (necessário para os anúncios)

O Google AdSense tende a recusar sites com "conteúdo de pouco valor", por exemplo páginas só com ligações para outros sites. Para reduzir esse risco, cada sugestão tem uma **nota editorial original**, em português de Portugal, com 2 a 4 frases. A nota diz do que trata o texto e porque vale a pena lê-lo, sem reproduzir excertos.

- As notas podem ser geradas automaticamente na tarefa diária, mas ficam marcadas como "por rever" até o dono do projeto as aprovar.
- Prever um ficheiro ou campo `reviewed: true/false` e uma forma simples de rever as notas pendentes.
- Estilo das notas: português de Portugal natural, sem expressões traduzidas à letra do inglês, sem tom moralista, sem frases feitas, sem emojis.
- A página `/sobre` também deve ter texto original com alguma substância.


## 9. Anúncios, privacidade e cookies

- Prever espaços de anúncio que não prejudiquem a leitura:
  - nas páginas Hoje e de cada dia, um entre o segundo e o terceiro cartão e outro no fim;
  - no Arquivo, no máximo um a cada 10 dias da lista.
- Não colocar anúncios no topo do ecrã no telemóvel. Reservar a altura dos espaços para evitar saltos de layout (CLS).
- Os anúncios só carregam depois do consentimento. Usar uma plataforma de gestão de consentimento certificada pela Google (CMP com TCF v2.2), obrigatória para servir anúncios a utilizadores da UE.
- O ID de publisher e os IDs dos espaços ficam em variáveis de configuração. Enquanto não existirem, os espaços não aparecem.
- Gerar o ficheiro `ads.txt` a partir da configuração.
- Análise de tráfego: usar uma ferramenta sem cookies (por exemplo Plausible ou Cloudflare Web Analytics) ou condicioná-la ao consentimento.

## 10. Aspeto e funcionamento

- Prioridade ao telemóvel:
  - uma única coluna, com largura de leitura confortável no computador (cerca de 680px);
  - os separadores Hoje e Arquivo sempre visíveis no topo, sem ocupar muito espaço.
- Modo claro e modo escuro, a acompanhar a definição do sistema (`prefers-color-scheme`). Cores definidas como variáveis CSS.
- Visual limpo e sóbrio:
  - letra legível, com corpo mínimo de 16px no texto;
  - boa entrelinha;
  - sem emojis.
- Acessibilidade:
  - navegação completa por teclado;
  - separadores com semântica correta e indicação da página atual;
  - contraste AA;
  - foco visível.
- Desempenho:
  - páginas geradas como HTML estático; JavaScript só para as marcações de leitura, o filtro do Arquivo e o consentimento;
  - Lighthouse acima de 90 em telemóvel.
- Datas e meses em português, usando `Intl.DateTimeFormat('pt-PT', { timeZone: 'Europe/Lisbon' })`.

## 11. Ordem de trabalho sugerida

1. Verificar `robots.txt` e termos de cada fonte e reportar o resultado.
2. Scripts de recolha e construção dos catálogos iniciais. Mostrar quantos textos há em cada categoria.
3. Lógica de seleção diária, com testes: sem repetições, seleção fixa, reinício do ciclo.
4. Interface das páginas Hoje, Arquivo e de cada dia, com dados de exemplo.
5. Tarefa agendada em GitHub Actions e deploy.
6. Notas editoriais e fluxo de revisão.
7. Páginas legais, consentimento de cookies e espaços de anúncio (inativos até haver IDs).
8. SEO: sitemap, metadados, Open Graph.

No fim de cada passo, mostrar o resultado e esperar confirmação antes de avançar para o seguinte.

## 12. Decisões em aberto (perguntar ao dono do projeto)

- Endereço do repositório no GitHub e domínio do site.
- Data de lançamento (primeiro dia de leituras).
- Cores definitivas das três categorias.
- Se, no futuro, se publica o texto integral dos contos em domínio público.
- Se se acrescentam mais fontes, depois de ver quantos textos tem cada catálogo no passo 2.
