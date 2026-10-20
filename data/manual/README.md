# Curadoria manual

Fontes cujos termos proíbem a recolha automática mas permitem ligações. Os textos são
escolhidos à mão, no browser, e registados aqui. Os scripts não fazem pedidos a estes sites.

Cada ficheiro tem esta forma:

```json
{
  "source": "newyorker",
  "siteName": "The New Yorker",
  "items": [
    {
      "category": "essay",
      "title": "Título do texto",
      "author": "George Steiner",
      "url": "https://www.newyorker.com/magazine/...",
      "paywalled": false
    }
  ]
}
```

- `category`: `poem`, `essay` ou `story`.
- `paywalled`: tem de ser `false`. Só entram na seleção textos de acesso livre e gratuito;
  um texto com `true` (só para assinantes) ou sem este campo fica no catálogo mas nunca é escolhido.
  Confirmar no browser, sem sessão iniciada, que o texto se lê na íntegra.

Depois de editar, correr `npm run collect -- --source <fonte>` para os textos entrarem no catálogo.
