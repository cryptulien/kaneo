# SuperPagr fork of Kaneo

Branche `superpagr` à partir de `v2.17.6` (`619754b8`).
Image locale : `kaneo:superpagr` (`pull_policy: never`).

## Delta

- Couleurs de colonnes : éditeur Workflow + bandeau coloré board/liste + champ `color` renvoyé par `/api/task/tasks`
- Bouton **Create task** visible dans la toolbar du board
- Plus de colonne avec le libellé « Add task »
- Filtre **Hide labels** + **Hide done columns** (persisté)
- Copie d’URLs en masse (toolbar de sélection)
- MCP `/api/mcp` accepte la clé API (`Authorization: Bearer` ou `x-api-key`)
- Outils MCP : `add_task_link`, `get_task_permalink`, `get_task_permalinks`

## Rebuild

```bash
cd /root/kaneo
docker build -t kaneo:superpagr -t kaneo:superpagr-$(git rev-parse --short HEAD) -f Dockerfile.kaneo .
cd /docker/kaneo && docker compose up -d --force-recreate kaneo
```

## Rebase upstream

```bash
git fetch https://github.com/usekaneo/kaneo.git main
git rebase v2.x.y
```
