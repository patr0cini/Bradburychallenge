# Produtos (merchandising)

Desenhos prontos a enviar para um serviço de impressão sob encomenda. Geram-se com `npm run merch` e ficam em `merch/out/` (PNG de alta resolução; não vão para o git).

| Ficheiro | Produto | Tamanho |
|---|---|---|
| `tote-bag-dark-ink.png`, `tote-bag-white-ink.png` | Tote bag: "One poem. One essay. One story. Every day." (tinta escura para tecido claro, branca para escuro) | 4500 × 5400, fundo transparente |
| `mug-bacon-wrap.png` | Caneca de 11 oz, volta inteira: Francis Bacon, "Of Studies" (1625) | 2820 × 1080, fundo transparente |
| `poster-readers-glossary.png` | Cartaz "The Reader's Glossary" com as 146 figuras do glossário do site | 3600 × 4800 (18 × 24 in a 200 dpi) |
| `poster-thousand-nights-tracker.png` | Cartaz-registo "A Thousand Nights": mil círculos para preencher, um por noite | 3600 × 4800 |

Cada serviço tem o seu modelo (zona de impressão, margens, proporção). Ajustar o tamanho no editor deles, sem esticar. Se algum precisar de outras medidas, edita-se `merch/build.ts` e corre-se de novo.

## Regras que os desenhos seguem

1. **Nada de Bradbury.** Os desenhos não levam o nome, citações, assinatura nem retrato de Ray Bradbury. A Ray Bradbury Literary Works LLC tem marcas registadas (por exemplo "RAY BRADBURY" com a assinatura, para livros e serviços de venda de livros) e os termos do site oficial proíbem sugerir aprovação ou afiliação. As citações dele estão protegidas por direitos de autor. Num produto à venda o risco é maior do que num site editorial.
2. **Sem o endereço do site em destaque.** `bradburychallenge.org` contém o apelido dele. Se se quiser pôr o endereço, que seja pequeno (por exemplo na etiqueta ou na bainha) e só depois de a Ray Bradbury Literary Works dizer que não se opõe. Vale a pena perguntar-lhes por escrito, como se fez com a Public Domain Review.
3. **Só texto nosso e domínio público.** A frase "One poem. One essay. One story. Every day." é nossa. Francis Bacon (1625) está em domínio público. Os nomes das figuras literárias são termos comuns.
4. **Fonte PT Serif**, com licença OFL (`assets/fonts/OFL.txt`), que permite uso comercial.
5. **Nome dos produtos:** evitar "Bradbury" nos títulos e etiquetas ("Reading challenge tote", "A Thousand Nights tracker"). As pesquisas por esse nome atraem queixas de propriedade intelectual.

## Onde vender (por ordem do que eu faria)

1. **Descarregáveis (Gumroad ou Etsy).** O cartaz-registo e o glossário vendem-se como ficheiro para imprimir em casa: sem stock, sem envios, sem custos de produção. É o mais simples e com a melhor margem. Pode ser um PDF A3 ou A4 com os mesmos desenhos.
2. **Impressão sob encomenda (Printful, Printify, Redbubble, Spreadshirt).** Cartaz, caneca e tote bag, sem stock. A margem é pequena (poucos euros por artigo) e o serviço trata da impressão e do envio. Quem escolhe o preço é o José: o custo de base mais a margem que quiser.
3. **Etsy ligada a um desses serviços.** Dá visibilidade, mas cobra uma taxa por anúncio e uma comissão por venda.

Antes de abrir qualquer loja, confirmar no próprio serviço: as taxas atuais, o custo de base de cada produto, os países para onde enviam e se imprimem na UE (os envios de fora da UE pagam IVA e alfândega e demoram mais).

## Questões práticas (não é aconselhamento fiscal)

- Vender produtos em Portugal costuma exigir atividade aberta nas Finanças e emissão de fatura. Convém falar com um contabilista antes da primeira venda, sobretudo por causa do IVA nas vendas a outros países da UE.
- As contas nos serviços e os dados de pagamento são do José; eu não as crio nem preencho.
- Sugerir os produtos no site (uma linha na página de apoio, por exemplo) só depois de a loja existir e de a pergunta à Ray Bradbury Literary Works ter resposta.

## O que falta

- Confirmar a pergunta à Ray Bradbury Literary Works sobre merchandising com o nome do projeto.
- Escolher o serviço, criar a conta e carregar os ficheiros.
- Pedir uma amostra de cada produto antes de o pôr à venda (para ver a cor e o tamanho reais).
