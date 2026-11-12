#!/usr/bin/env bash
# Creates the skeleton of a new team project in a directory (default: the current directory) and
# commits it in the project's git repository on the branch conception. The framework files (assets,
# templates, scripts) are read from the plugin this script belongs to; nothing is written in the
# plugin. Every check runs before the first write; on failure, what the script created is removed.
# The project language (BCP 47 code, default en) goes to .team/projet.json and sets the language of the
# texts this script writes (team/conventions/langue.md).
# Usage: init-projet.sh [--lang <code>] <slug> "<Project name>" [<project dir>]
set -euo pipefail

usage='usage: init-projet.sh [--lang <code>] <slug> "<Project name>" [<project dir>]'
lang=en
pos=()
while [ $# -gt 0 ]; do
  case "$1" in
    --lang) [ $# -ge 2 ] || { echo "$usage" >&2; exit 1; }; lang="$2"; shift 2;;
    --lang=*) lang="${1#--lang=}"; shift;;
    *) pos+=("$1"); shift;;
  esac
done
set -- "${pos[@]+"${pos[@]}"}"
slug="${1:?$usage}"
name="${2:-$slug}"
target="${3:-.}"
root="$(cd "$(dirname "$0")/../.." && pwd)"
today="$(date +%Y-%m-%d)"
fail() { echo "init-projet: $*" >&2; exit 1; }

# 1. Checks, before any write.
[[ "$slug" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || fail "slug '$slug' must be kebab-case (a-z, 0-9, -)"
[ -n "${name//[[:space:]]/}" ] || fail "empty project name"
[[ "$lang" =~ ^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$ ]] || fail "language '$lang' must be a BCP 47 code (fr, en, de, pt-BR)"
case "$name" in *$'\n'*) fail "project name on one line only";; esac
command -v node >/dev/null || fail "node is required"
command -v git >/dev/null || fail "git is required"
if [ -d "$target" ]; then
  dir="$(cd "$target" && pwd)"; made_target=false
else
  parent="$(dirname "$target")"
  [ -d "$parent" ] || fail "$parent does not exist"
  dir="$(cd "$parent" && pwd)/$(basename "$target")"; made_target=true
fi
case "$dir/" in "$root"/*) fail "refusing to create a project inside the plugin ($root)";; esac
for p in .team docs; do
  [ -e "$dir/$p" ] && fail "$dir/$p already exists: a ShipItRight project needs a folder without .team/ nor docs/ (move docs/ away or pick another folder)"
done

in_repo=false
if git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  in_repo=true
  top="$(cd "$(git -C "$dir" rev-parse --show-toplevel)" && pwd)"
  [ "$top" = "$dir" ] || fail "$dir is inside the git repository $top: open the project at the root of its own repository"
  orig_branch="$(git -C "$dir" symbolic-ref --quiet --short HEAD || true)"
  if git -C "$dir" show-ref --verify --quiet refs/heads/conception; then
    for p in .team docs; do
      git -C "$dir" cat-file -e "conception:$p" 2>/dev/null \
        && fail "branch conception already holds $p/: this repository already has a ShipItRight project"
    done
    # Reuse the existing branch only if switching to it cannot touch uncommitted work.
    [ "$orig_branch" = conception ] || [ -z "$(git -C "$dir" status --porcelain --untracked-files=no)" ] \
      || fail "branch conception exists and the working tree has uncommitted changes: commit or stash them, or switch to conception yourself"
  fi
fi

# 2. Writes, undone on failure.
created=()      # paths created by this script, removed on failure
backups=()      # "path|backup" of files modified by this script, restored on failure
tmp="$(mktemp -d)"
switched=false; new_branch=false; staged=()
cleanup() {
  local code=$?
  if [ $code -ne 0 ]; then
    local born=false
    git -C "$dir" rev-parse --verify --quiet HEAD >/dev/null 2>&1 && born=true
    if [ ${#staged[@]} -gt 0 ]; then
      if $born; then git -C "$dir" reset -q -- "${staged[@]}" || true
      else git -C "$dir" rm -r -q --cached --ignore-unmatch -- "${staged[@]}" || true; fi
    fi
    for p in "${created[@]+"${created[@]}"}"; do rm -rf "${dir:?}/$p"; done
    for b in "${backups[@]+"${backups[@]}"}"; do cp "${b#*|}" "$dir/${b%%|*}"; done
    if $switched && [ -n "${orig_branch:-}" ] && [ -d "$dir/.git" ]; then
      if $born; then
        git -C "$dir" checkout -q "$orig_branch" || true
        if $new_branch; then git -C "$dir" branch -q -D conception || true; fi
      else
        git -C "$dir" symbolic-ref HEAD "refs/heads/$orig_branch" || true
      fi
    fi
    if $made_target; then rmdir "$dir" 2>/dev/null || true; fi
    echo "init-projet: failed, nothing kept in $dir" >&2
  fi
  rm -rf "$tmp"
}
trap cleanup EXIT

if $made_target; then mkdir "$dir"; fi
if ! $in_repo; then git -C "$dir" init -q; created+=(.git); orig_branch=""; fi
if [ "$(git -C "$dir" symbolic-ref --quiet --short HEAD || true)" != conception ]; then
  if git -C "$dir" show-ref --verify --quiet refs/heads/conception; then
    git -C "$dir" checkout -q conception
  else
    git -C "$dir" checkout -q -b conception; new_branch=true
  fi
  switched=true
fi

newdir() { # creates a top-level directory of the project, tracked for cleanup
  if [ ! -e "$dir/$1" ]; then mkdir "$dir/$1"; created+=("$1"); fi
}
for p in .team docs prototype backend frontend; do newdir "$p"; done
mkdir -p "$dir"/.team/{board,forum,questions} \
         "$dir"/docs/{_assets,00-cadrage,10-analyse,20-specs/epics,20-specs/stories,20-ux,30-conception/api,40-qa,50-recette,sprints,adr}

cp "$root"/team/assets/* "$dir/docs/_assets/"
printf '{ "langue": "%s" }\n' "$lang" > "$dir/.team/projet.json"

# The name goes through node: no shell or sed escaping, HTML-escaped where it lands in a page.
subst() { # subst <template> <output> <html|text>
  PROJECT_NAME="$name" node -e '
    const fs = require("fs");
    const [src, out, mode] = process.argv.slice(1);
    const n = process.env.PROJECT_NAME;
    const v = mode === "html"
      ? n.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      : n;
    fs.writeFileSync(out, fs.readFileSync(src, "utf8").split("NOM_PROJET").join(v));
  ' "$1" "$2" "$3"
}
subst "$root/skills/livrable-pilotage/template-pilotage.html" "$dir/docs/index.html" html
node "$root/team/scripts/i18n-assets.mjs" "$dir" >/dev/null

# Texts in the project language (team/i18n/<lang>/init.json, en when the language has none).
# The name goes through node: no shell or sed escaping.
texts() { # texts <key> <output>
  PROJECT_NAME="$name" node --input-type=module -e '
    import { writeFileSync } from "node:fs";
    const [lib, dir, key, out] = process.argv.slice(1);
    const { loadLabels, makeT, projectLang } = await import(lib);
    const t = makeT(projectLang(dir), loadLabels(dir, ["init"]));
    writeFileSync(out, t("init." + key, { name: process.env.PROJECT_NAME }));
  ' "$root/team/scripts/lib/i18n.mjs" "$dir" "$1" "$2"
}
texts journal "$dir/.team/journal.md"
texts journal.created "$tmp/created.txt"
printf '%s %s · création · %s\n' "$today" "$(date +%H:%M)" "$(cat "$tmp/created.txt")" >> "$dir/.team/journal.md"
texts socle "$dir/.team/socle.md"
texts readme "$tmp/readme-section.md"

if [ ! -e "$dir/README.md" ]; then
  { printf '# %s\n\n' "$name"; cat "$tmp/readme-section.md"; } > "$dir/README.md"
  created+=(README.md)
elif ! grep -qxF '## ShipItRight' "$dir/README.md"; then
  cp "$dir/README.md" "$tmp/README.md.bak"; backups+=("README.md|$tmp/README.md.bak")
  { printf '\n'; cat "$tmp/readme-section.md"; } >> "$dir/README.md"
fi

ignores="HANDOVER.md
.env
*.local
node_modules/
dist/
.angular/
target/
.bsp/
.bloop/
.metals/
project/target/
.worktrees/
.team/socles/*/*/source"
if [ -e "$dir/.gitignore" ]; then
  cp "$dir/.gitignore" "$tmp/gitignore.bak"; backups+=(".gitignore|$tmp/gitignore.bak")
else
  : > "$dir/.gitignore"; created+=(.gitignore)
fi
while IFS= read -r line; do
  grep -qxF "$line" "$dir/.gitignore" || printf '%s\n' "$line" >> "$dir/.gitignore"
done <<< "$ignores"

node "$root/team/scripts/questions-page.mjs" "$dir" >/dev/null
# A new project has no story map yet: that warning is expected here, the others are shown.
pil="$(node "$root/team/scripts/pilotage-pages.mjs" "$dir" 2>&1 >/dev/null)" || { printf '%s\n' "$pil" >&2; exit 1; }
printf '%s\n' "$pil" | grep -v -e '^warn 20-specs/story-map.html absente' -e '^$' >&2 || true

# Git keeps no empty directory: a .gitkeep in each one this script left empty.
paths=()
for p in "${created[@]}"; do [ "$p" = .git ] || paths+=("$p"); done
for b in "${backups[@]+"${backups[@]}"}"; do paths+=("${b%%|*}"); done
for p in .team docs prototype backend frontend; do
  case " ${created[*]} " in *" $p "*) find "$dir/$p" -type d -empty -exec touch {}/.gitkeep \; ;; esac
done

staged=("${paths[@]}")
git -C "$dir" add -- "${paths[@]}"
git -C "$dir" commit -q -m "chore: initialise project skeleton" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>" -- "${paths[@]}"
echo "project $slug created in $dir, git branch: conception"
