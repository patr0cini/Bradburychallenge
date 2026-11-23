# Produtos (merchandising)

Desenhos prontos a enviar para um serviço de impressão sob encomenda, ou a vender como ficheiro. Geram-se com `npm run merch` e ficam em `merch/out/` (PNG e PDF de alta resolução; não vão para o git). Os textos dos anúncios estão em `merch/listings.md` (Etsy e Gumroad) e `merch/redbubble.md` (Redbubble, com ficheiros nos tamanhos oficiais em `merch/out/redbubble/`).

| Ficheiro | Produto | Tamanho |
|---|---|---|
| `tote-bag-dark-ink.png`, `tote-bag-white-ink.png` | Tote bag: "One poem. One essay. One story. Every day." (tinta escura para tecido claro, branca para escuro) | 4500 × 5400, fundo transparente |
| `mug-bacon-wrap.png` | Caneca de 11 oz, volta inteira: Francis Bacon, "Of Studies" (1625) | 2820 × 1080, fundo transparente |
| `poster-readers-glossary.png` | Cartaz "The Reader's Glossary" com as figuras do glossário do site | 3600 × 4800 (18 × 24 in a 200 dpi) |
| `poster-thousand-nights-tracker.png` | Cartaz-registo "A Thousand Nights": mil círculos para preencher, um por noite | 3600 × 4800 |
| `print-a3-readers-glossary.png/.pdf`, `print-a3-thousand-nights-tracker.png/.pdf` | Os mesmos cartazes na proporção das folhas A (A3, 300 dpi), para vender como descarregável e imprimir em casa em A3 ou A4 | 3508 × 4961; PDF de uma página A3 |

Cada serviço tem o seu modelo (zona de impressão, margens, proporção). Ajustar o tamanho no editor deles, sem esticar. Se algum precisar de outras medidas, edita-se `merch/build.ts` e corre-se de novo.

## Regras que os desenhos seguem

1. **Nada de Ray Bradbury.** Os desenhos não levam o nome, citações, assinatura nem retrato dele. A Ray Bradbury Literary Works LLC tem marcas registadas (por exemplo "RAY BRADBURY" com a assinatura, para livros e serviços de venda de livros) e os termos do site oficial proíbem sugerir aprovação ou afiliação. As citações dele estão protegidas por direitos de autor.
2. **A marca nos produtos é "RB Challenge"** (decisão de 24 de novembro de 2026, em vez de "Bradbury Challenge"), em pequeno, sem o endereço `bradburychallenge.org`. "RB" lê-se como as iniciais dele, por isso o risco diminui mas não desaparece. Os anúncios dizem que é um projeto independente. Se alguém se queixar, tira-se a marca dos desenhos (ou muda-se o nome para "A Thousand Nights") e volta a gerar-se com `npm run merch`, mudando `BRAND` em `merch/build.ts`.
3. **Só texto nosso e domínio público.** "One poem. One essay. One story. Every day." é nossa. Francis Bacon (1625) está em domínio público. Os nomes das figuras literárias são termos comuns.
4. **Fonte PT Serif**, com licença OFL (`assets/fonts/OFL.txt`), que permite uso comercial.
5. **Nos anúncios, nada de "Bradbury"** nos títulos, descrições e etiquetas. As pesquisas por esse nome atraem queixas de propriedade intelectual e podem levar à suspensão da conta.

## Onde vender (por ordem do que eu faria)

1. **Descarregáveis (Gumroad ou Etsy).** Os dois cartazes (`print-a3-*.pdf`) vendem-se como ficheiro para imprimir em casa: sem stock, sem envios, sem custos de produção. É o mais simples e com a melhor margem.
2. **Impressão sob encomenda (Printful, Printify, Redbubble, Spreadshirt).** Cartaz, caneca e tote bag, sem stock. A margem é pequena (poucos euros por artigo) e o serviço trata da impressão e do envio. O preço é o custo de base mais a margem que o José escolher.
3. **Etsy ligada a um desses serviços.** Dá visibilidade, mas cobra uma taxa por anúncio e uma comissão por venda.

Antes de abrir qualquer loja, confirmar no próprio serviço: as taxas atuais, o custo de base de cada produto, os países para onde enviam e se imprimem na UE (os envios de fora da UE pagam IVA e alfândega e demoram mais).

## Questões práticas (não é aconselhamento fiscal)

- Vender produtos em Portugal costuma exigir atividade aberta nas Finanças e emissão de fatura. Convém falar com um contabilista antes da primeira venda, sobretudo por causa do IVA nas vendas a outros países da UE.
- As contas nos serviços e os dados de pagamento são do José; eu não as crio nem preencho.
- Sugerir os produtos no site (uma linha na página de apoio, por exemplo) só depois de a loja existir.

## O que falta

- Escolher o serviço, criar a conta e carregar os ficheiros com os textos de `merch/listings.md`.
- Pedir uma amostra de cada produto antes de o pôr à venda (para ver a cor e o tamanho reais).
- Opcional: perguntar à Ray Bradbury Literary Works se se opõem a "RB Challenge" em produtos. Uma resposta por escrito vale mais do que qualquer leitura nossa.
