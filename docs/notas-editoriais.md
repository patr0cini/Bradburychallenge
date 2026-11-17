# Notas editoriais

Cada leitura pode ter uma nota original em inglês, de 2 a 4 frases, que diz do que trata o texto e porque vale a pena lê-lo, sem citar excertos (secção 8 da especificação). As notas são o conteúdo próprio do site e foram repostas a 17 de novembro de 2026, depois de o AdSense recusar o site por "Low value content" (a página de um dia tinha só títulos e ligações).

## Onde ficam

`data/notes.json`, pelo id do texto:

```json
{
  "libraryofshortstories:libraryofshortstories.com/onlinereader/miss-brill": {
    "text": "On a Sunday afternoon Miss Brill…",
    "reviewed": true,
    "origin": "generated",
    "updatedAt": "2026-11-17T10:00:00.000Z",
    "reviewedAt": "2026-11-17T11:00:00.000Z"
  }
}
```

**Só as notas com `reviewed: true` aparecem no site.** Os rascunhos ficam guardados mas invisíveis até serem aprovados pelo dono do projeto.

## Como se escrevem

- **Rascunhos:** escritos pelo Claude numa sessão, a partir do texto lido (`origin: "generated"`). Não há geração automática: precisava de uma chave da API da Anthropic, que tem custos. O código está no git (commit `0d0a627`), se algum dia fizer sentido.
- **Fontes que o gerador pode ler** (`generatorMayReadText`, em `src/lib/notes.ts`): Wikisource, Project Gutenberg, Library of Short Stories, RPO, Lit Hub e Poetry Archive. A LARB e a NYRB bloqueiam no `robots.txt` os robôs de IA (ClaudeBot, GPTBot, CCBot…), o que, à luz da diretiva europeia sobre mineração de texto, é uma reserva de direitos: **não se leem esses textos, e as notas deles são escritas à mão** (ver `npm run notes -- pending`).
- A Library of Short Stories carrega os contos por JavaScript: lê-se com o browser, não com pedidos HTTP.

## Revisão

- **Página local:** `npm run review` e abrir `http://localhost:4400`. Para cada leitura sem nota aprovada há uma caixa de texto e os botões *Save and approve* e *Save draft*. Uma nota editada passa a contar como escrita à mão.
- **Linha de comandos:** `npm run notes -- pending` lista o que falta; `npm run notes -- approve --date AAAA-MM-DD` aprova as notas de um dia; `npm run notes -- approve <id…>` aprova notas concretas; `npm run notes -- set <id> --text "…"` escreve ou corrige uma nota (fica aprovada).
- Depois: commit e push de `data/notes.json`; o deploy seguinte publica as notas aprovadas.

## Regras de estilo (verificadas automaticamente)

`noteProblems` em `src/lib/notes.ts` assinala:
- menos de 2 ou mais de 4 frases (as iniciais, como "E. M.", partem frases: escrever o apelido); notas demasiado curtas ou longas;
- emojis, pontos de exclamação, formatação;
- frases feitas ("timeless", "masterpiece", "testament to", "delve", "invites readers", "gem"…; "judgement" contém "gem");
- citações entre aspas com mais de 6 palavras, ou 8 ou mais palavras seguidas iguais ao texto original.

Notas sobre textos que se leu: dizer só o que se leu ou se sabe; não revelar finais.
