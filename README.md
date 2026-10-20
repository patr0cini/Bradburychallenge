# Bradbury Challenge

Todos os dias, um poema, um ensaio e um conto. O site mostra apenas título, autor, fonte,
ligação para o original e uma nota editorial própria. Nunca reproduz os textos.

A especificação completa está em `bradbury-challenge-especificacao.md`, a verificação de
fontes (robots.txt, termos de utilização e acesso livre) em `docs/verificacao-fontes.md` e a
publicação e tarefa diária (GitHub Actions e Cloudflare Pages) em `docs/publicacao.md`.

## Requisitos

Node.js 20 ou mais recente.

```bash
npm install
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run collect` | Atualiza os catálogos das fontes cuja última recolha passou o intervalo mínimo (7 dias; 28 para RPO e Poetry Archive) |
| `npm run collect -- --source lithub` | Recolhe só uma fonte (pode repetir-se) |
| `npm run collect -- --force` | Ignora o intervalo mínimo |
| `npm run collect -- --full` | Recolha completa em vez de incremental |
| `npm run schedule` | Acrescenta a `data/schedule.json` a seleção dos dias em falta, desde a data de início até hoje (Lisboa). Nunca altera dias já gravados nem gera dias futuros |
| `npm run schedule -- --date 2026-11-03` | Gera até esse dia (e os anteriores em falta) |
| `npm run schedule -- --dry-run` | Mostra a seleção sem gravar |
| `npm run check-access -- --source nybooks` | Verifica na página de cada texto se é de acesso livre e atualiza `paywalled` |
| `npm run stats` | Número de textos por categoria e fonte |
| `npm run validate` | Campos obrigatórios, ids e URLs repetidos, duplicados entre fontes |
| `npm run validate -- --urls --sample 50` | Verifica também se os URLs respondem (amostra de 50 por categoria) |
| `npm test` | Testes |
| `npm run dev` / `npm run build` | Site (Astro) com os dados reais |
| `npm run sample` | Gera 45 dias de dados de exemplo em `data/sample/` (não versionado) |
| `npm run dev:sample` / `npm run build:sample` | Site com os dados de exemplo |

## Dados

- `data/catalog/poems.json`, `essays.json`, `stories.json`: catálogos. Os textos nunca são apagados;
  quando uma fonte deixa de os listar ficam `active: false`.
- `data/manual/*.json`: fontes de curadoria manual (ver `data/manual/README.md`).
- `data/state/sources.json`: data da última recolha e último erro de cada fonte.
- `data/state/excluded.json`: textos vistos e deixados de fora, com o motivo (excertos, listas, contos infantis...).

## Seleção diária

`src/lib/selection.ts`. Para cada categoria e cada dia:

1. São elegíveis os textos ativos com menos usos; primeiro todos os que nunca saíram.
   Quando se esgotam, o script tenta atualizar o catálogo; se não houver novos, começa um novo
   ciclo, só com textos que não saem há mais de 365 dias, e regista um aviso.
2. Escolhe-se a fonte mais atrasada em relação à sua quota (proporcional ao tamanho do catálogo),
   nunca a de ontem quando outra ainda tem textos elegíveis.
3. Dentro da fonte, sai o texto com menor `sha256(seed | categoria | ciclo | id)`: ordem
   pseudo-aleatória e determinística. A seed é `BRADBURY_SEED`.

Só entram textos ativos e confirmados como gratuitos (`paywalled: false`).

Cada dia guarda uma cópia do título, autor, URL e fonte, para ficar fixo mesmo que o catálogo mude.

## Língua do site

O site é só em inglês (decisão do dono do projeto, 20 de outubro de 2026, em vez da interface em
português prevista na especificação). URLs: `/` (Today), `/archive/` e `/AAAA/MM/DD/`. Os textos
da interface estão em `src/site/strings.ts`. As notas editoriais são em inglês
(`data/notes.json`: `{ id: { text, reviewed } }`) e só aparecem depois de aprovadas.
A documentação do projeto e os comentários do código continuam em português.

## Fontes

Cada fonte é um módulo em `src/sources/` com a interface `Source` (`src/lib/types.ts`).
Todos os pedidos passam por `PoliteClient` (`src/lib/http.ts`), que lê o robots.txt, respeita
o crawl-delay (mínimo 3 s entre pedidos ao mesmo site) e se identifica no User-Agent.
Uma fonte que falhe fica registada nos logs e não impede as outras.

Para acrescentar uma fonte: criar o módulo, registá-lo em `src/sources/index.ts` e
verificar antes o robots.txt e os termos do site.

## Credenciais

Nada de tokens ou chaves no repositório. Segredos do workflow ficam em GitHub Secrets.
Configuração local opcional por variáveis de ambiente: `BRADBURY_START_DATE`, `BRADBURY_SEED`,
`BRADBURY_CONTACT_URL`.
