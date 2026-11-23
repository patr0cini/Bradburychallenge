# Amigos do projeto (apoio mensal)

Um escalão de apoio mensal no Ko-fi, a 3 euros por mês. Em troca, o apoiante pode ter o nome na lista de agradecimento da página [Buy me a coffee](/support/). Mais nada: tudo no site continua grátis para todos, e não há emails nem conteúdos à parte.

O bloco "Friends of the project" da página de apoio só aparece quando a variável `BRADBURY_MEMBERSHIP_URL` está definida. Sem ela, a página fica como estava.

## Montar o escalão no Ko-fi (passos do José)

Segundo o artigo oficial do Ko-fi "Ko-fi Memberships and Membership Tiers":

1. No menu do Ko-fi, ir a *Memberships* e pôr o modo em **Membership tiers**.
2. *Add Tier*, com o nome e o preço mínimo por mês. Valores sugeridos:
   - **Nome:** Friend of the project
   - **Preço:** 3 euros por mês
   - **Benefício:** Your name on the supporters list on bradburychallenge.org (optional)
   - **Descrição:** A small monthly thank-you that helps keep Bradbury Challenge free for everyone. If you like, your name will appear on the supporters list on the Buy me a coffee page.
3. **Welcome message:** Thank you for supporting the project. If you would like your name on the supporters list, reply to this message or write to contact@bradburychallenge.org with the name you would like us to use. If you prefer to stay anonymous, you do not need to do anything.
4. **Standard terms** (os membros têm de os aceitar; o José é o vendedor). Texto sugerido: *The Friend of the project tier is a monthly contribution of 3 euros that supports the site. The only benefit is the optional listing of your name on the supporters page. You can cancel at any time from your Ko-fi account. Contributions are not refundable once charged.* Rever com cuidado: as regras de reembolso dependem da lei aplicável.
5. Ativar o escalão. O endereço da página de membros é `https://ko-fi.com/bradburychallenge/tiers`.
6. Criar `BRADBURY_MEMBERSHIP_URL` no Cloudflare Pages (*Settings → Variables and secrets*) com esse endereço e fazer um novo deploy.

## Taxas (confirmar no Ko-fi antes de fixar o preço)

Segundo a página oficial "Does Ko-fi take a fee?", no plano gratuito há uma taxa de serviço de **5% nas memberships**, que o Ko-fi Gold (cerca de 12 dólares por mês) elimina. Além disso, o PayPal ou o Stripe cobram a sua taxa por pagamento, tipicamente uma percentagem mais um valor fixo (da ordem de 0,25 a 0,35 euros). Com 3 euros por mês, essa parte fixa pesa: **cada pagamento pode render cerca de 2,4 a 2,5 euros** líquidos. Não é para enriquecer, e sim um gesto de agradecimento. Se quiser que sobre mais, o escalão pode custar 5 euros.

## Lista de apoiantes (RGPD)

- **Só com consentimento.** Um nome só vai para a lista se a pessoa o pedir (por resposta à mensagem de boas-vindas, ou por email para contact@bradburychallenge.org). Não se copia o nome que o Ko-fi mostra, a não ser que a pessoa diga que pode ser.
- **Onde se mantém:** `data/supporters.json`, uma lista de nomes, por exemplo `["Ana Silva", "J. Costa"]`. Depois de editar: commit, push e novo deploy. A lista aparece sozinha na página de apoio quando tem pelo menos um nome.
- **Retirar:** se alguém pedir, apaga-se o nome do ficheiro e volta a publicar-se. A política de privacidade já diz isto, quando `BRADBURY_MEMBERSHIP_URL` está definida.
- Quem fizer um donativo único também pode pedir para ser listado. Não há distinção.
