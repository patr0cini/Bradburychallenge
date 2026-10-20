#!/usr/bin/env bash
# Faz commit das alterações nos dados e envia-as para o repositório. Usado pelos workflows do
# GitHub Actions, com o GITHUB_TOKEN do próprio workflow (nunca um token pessoal).
#   bash scripts/commit-data.sh "mensagem do commit" [caminhos...]   (por omissão: data)
# Se outra execução tiver enviado alterações entretanto, integra-as (rebase) e tenta de novo.
set -euo pipefail

message="${1:?Falta a mensagem do commit}"
shift
paths=("$@")
if [ ${#paths[@]} -eq 0 ]; then paths=(data); fi

# Identidade do bot do GitHub Actions, para o commit e para um eventual rebase.
export GIT_AUTHOR_NAME="github-actions[bot]"
export GIT_AUTHOR_EMAIL="41898282+github-actions[bot]@users.noreply.github.com"
export GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME"
export GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"

git add -- "${paths[@]}"
if git diff --cached --quiet; then
  echo "Sem alterações para enviar."
  exit 0
fi
git commit --quiet -m "$message"

branch="$(git rev-parse --abbrev-ref HEAD)"
for attempt in 1 2 3 4 5; do
  if git push --quiet origin "HEAD:$branch"; then
    echo "Enviado: $message"
    exit 0
  fi
  echo "Envio recusado (tentativa $attempt de 5); a integrar as alterações remotas."
  sleep $((attempt * 5))
  git pull --quiet --rebase origin "$branch"
done

echo "Não foi possível enviar as alterações depois de 5 tentativas." >&2
exit 1
