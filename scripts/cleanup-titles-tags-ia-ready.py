#!/usr/bin/env python3
"""Strip redundant [SP#]/[TASK-] prefixes, add surface tags, create IA ready."""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from pathlib import Path

TOKEN = Path("/root/.config/superpagr/kaneo-api-key").read_text().strip()
BASE = "http://127.0.0.1:3064/api"
WS = "WnAVeGFhI43vFLcY0i44oMAKYwb5ELqp"

PREFIX_RE = re.compile(
    r"^\s*(?:\[(?:SP|LL)#\d+\]\s*)+(?:\[TASK-\d+\]\s*)?",
    re.IGNORECASE,
)
TASK_MID_RE = re.compile(r"\s*\[TASK-\d+\]", re.IGNORECASE)
SPACE_RE = re.compile(r"\s{2,}")


def req(method: str, path: str, body=None):
    data = None if body is None else json.dumps(body).encode()
    request = urllib.request.Request(
        BASE + path,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        payload = exc.read().decode("utf-8", "replace")
        if exc.code in (409,):
            return {"conflict": True, "body": payload}
        raise RuntimeError(f"{method} {path} -> {exc.code} {payload[:400]}") from exc


def clean_title(title: str) -> str:
    cleaned = PREFIX_RE.sub("", title)
    cleaned = TASK_MID_RE.sub("", cleaned)
    cleaned = SPACE_RE.sub(" ", cleaned).strip(" -–—")
    return cleaned or title


def guess_tag(title: str, description: str, project_slug: str) -> str | None:
    text = f"{title}\n{description or ''}".lower()
    if project_slug == "sp-mobile":
        return "mobile"
    if project_slug == "infra":
        return "config"
    if project_slug == "le-lien":
        if "fiche" in text or "traduire" in text:
            return None
        return "front"
    if project_slug == "sp-business":
        return None

    front_hits = (
        "frontend",
        "webapp",
        "signup",
        "login",
        "affichage",
        "animation",
        "modal",
        "sidebar",
        "empty state",
        "ux ",
        "page ",
        "select",
        "carte",
        "polish visuel",
        "hydratation",
    )
    back_hits = (
        "backend",
        "api",
        "openapi",
        "migration",
        "sql",
        "jwt",
        "solveur",
        "or-tools",
        "endpoint",
        "webhook",
        "rls",
        "500",
        "pgx",
        "ortools",
        "quota",
        "worker",
    )
    config_hits = (
        "ci ",
        "lint",
        "swagger",
        "convert-openapi",
        "rate-limit",
        "makefile",
        "config",
        "tooling",
        "annotation",
    )
    admin_hits = ("admin —", "admin dashboard", "analytics", "pouls")
    is_front = any(h in text for h in front_hits)
    is_back = any(h in text for h in back_hits)
    is_config = any(h in text for h in config_hits)
    is_admin = any(h in text for h in admin_hits)
    if is_admin and not is_front and not is_back:
        return "config"
    if is_config and not is_front:
        return "config"
    if is_front and is_back:
        return "fullstack"
    if is_front:
        return "front"
    if is_back:
        return "back"
    return None


def ensure_labels() -> dict[str, str]:
    existing = req("GET", f"/label/workspace/{WS}")
    by_name = {item["name"]: item["id"] for item in existing}
    wanted = {
        "front": "blue",
        "back": "teal",
        "fullstack": "purple",
        "config": "dark-gray",
        "mobile": "green",
    }
    for name, color in wanted.items():
        if name in by_name:
            continue
        created = req(
            "POST",
            "/label",
            {"name": name, "color": color, "workspaceId": WS},
        )
        by_name[name] = created["id"]
    return by_name


def ensure_ia_ready(project_id: str) -> None:
    cols = req("GET", f"/column/{project_id}")
    by_slug = {c["slug"]: c for c in cols}
    if "ia-ready" not in by_slug:
        created = req(
            "POST",
            f"/column/{project_id}",
            {
                "name": "IA ready",
                "icon": "Wand2",
                "color": "#0891b2",
                "isFinal": False,
            },
        )
        by_slug["ia-ready"] = created
        cols = req("GET", f"/column/{project_id}")
        by_slug = {c["slug"]: c for c in cols}

    order = ["backlog", "to-do", "ia-ready", "in-progress", "in-review", "done"]
    remaining = [c for c in cols if c["slug"] not in order]
    remaining.sort(key=lambda c: c.get("position", 0))
    payload = []
    pos = 0
    for slug in order:
        col = by_slug.get(slug)
        if not col:
            continue
        payload.append({"id": col["id"], "position": pos})
        pos += 1
    for col in remaining:
        payload.append({"id": col["id"], "position": pos})
        pos += 1
    req("PUT", f"/column/reorder/{project_id}", {"columns": payload})


def main() -> None:
    labels = ensure_labels()
    projects = req("GET", f"/project?workspaceId={WS}")
    if isinstance(projects, dict):
        projects = projects.get("data") or projects.get("projects") or []

    titles_changed = 0
    tagged = 0
    for project in projects:
        if project.get("archivedAt"):
            continue
        ensure_ia_ready(project["id"])
        board = req("GET", f"/task/tasks/{project['id']}")
        columns = (board.get("data") or board).get("columns") or []
        for column in columns:
            for task in column.get("tasks") or []:
                old = task["title"]
                new = clean_title(old)
                if new != old:
                    req("PUT", f"/task/title/{task['id']}", {"title": new})
                    titles_changed += 1
                    task["title"] = new
                tag = guess_tag(
                    task["title"],
                    task.get("description") or "",
                    project.get("slug") or "",
                )
                if not tag:
                    continue
                current = {label["name"] for label in (task.get("labels") or [])}
                if tag in current:
                    continue
                req("PUT", f"/label/{labels[tag]}/task", {"taskId": task["id"]})
                tagged += 1

    print(json.dumps({"titles_changed": titles_changed, "tagged": tagged}, indent=2))


if __name__ == "__main__":
    main()
