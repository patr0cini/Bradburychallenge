# Livros nas páginas de autor (Bookshop.org e Amazon)

Cada página de autor (`/authors/<autor>/`) pode ter uma secção "Books by <autor>" com uma ou duas edições, com ligação ao **Bookshop.org** (afiliado) e à **Amazon** (afiliado, o código já existe). A secção só aparece se houver livros em `data/books.json` para esse autor **e** pelo menos um programa de afiliados configurado.

## Tornar-se afiliado do Bookshop.org (passos do José)

Segundo o centro de ajuda do Bookshop.org ("Can You Explain Bookshop.org's Affiliate Program?" e "How do Affiliate Links & Widgets work"):

1. No site do Bookshop.org (`bookshop.org`), criar uma conta. No fundo da página inicial há "Become an Affiliate"; carregar em "Join the Affiliate Program" e preencher o perfil e o endereço da página (por exemplo `rbchallenge`).
2. As comissões dos afiliados que não são livrarias são de cerca de **10%**, e a comissão é atribuída ao **último** link clicado, durante **48 horas** (as livrarias independentes recebem 30%, e uma parte da receita vai para um fundo repartido por elas). Os pagamentos e os impostos têm regras próprias: **confirmar nas condições do programa se pode participar a partir de Portugal e como é pago**. Eu não consegui verificar isto.
3. Numa página de um livro, na secção "Your Affiliate Link", carregar em **COPY**. O link tem a forma `https://bookshop.org/a/<número>/<ISBN>`. O `<número>` é o que se põe na variável abaixo.
4. No Cloudflare Pages, criar `BRADBURY_BOOKSHOP_ID` com esse número (só o número) e fazer um novo deploy. As ligações ao Bookshop.org aparecem em todos os livros. Sem a variável, só aparecem as da Amazon.

Se o formato do link for diferente do descrito, ajusta-se `bookshopLink` em `src/site/settings.ts`.

## Os livros

- `data/books.json`: um objeto por autor, com o slug da página (por exemplo `charles-lamb`) e a lista de edições: `{ "title": "...", "by": "Penguin Classics", "isbn13": "978..." }`. O site valida o ISBN-13 e calcula o ISBN-10, que a Amazon usa como código do produto.
- Escolher edições que estejam à venda (Penguin, Oxford World's Classics, Dover, Vintage, etc.), nunca reimpressões obscuras. Os ISBN dos clássicos foram verificados no Open Library (título e editora); **a disponibilidade no Bookshop.org e na Amazon não se consegue verificar por programa**, por isso convém abrir três ou quatro ligações depois de ligar o programa, e tirar as que derem erro.
- O Bookshop.org vende sobretudo nos EUA e no Reino Unido; para leitores de outros países a Amazon continua a ser a opção que chega.

## Divulgação

A secção diz, por baixo dos livros, "As a Bookshop.org affiliate I earn from qualifying purchases" e a frase da Amazon, e a política de privacidade menciona os dois programas quando estão ativos.
