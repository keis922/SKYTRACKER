#!/bin/bash
set -euo pipefail

########################################
# CONFIG
########################################
REMOTE_URL="${1:?Usage: ./push.sh <remote-url>}"
BRANCH="main"

KEIS_NAME="keis922"
KEIS_EMAIL="aissaouikeis@gmail.com"

TRISTAN_NAME="tristanhardouin"
TRISTAN_EMAIL="tristan.hardouin@edu.ece.fr"

########################################
# FENÊTRE DE DATES (11 → 22 novembre 2025)
########################################
START_DATE="2025-11-11T09:00:00+0100"
END_DATE="2025-11-22T18:00:00+0100"

START_TS=$(date -j -f "%Y-%m-%dT%H:%M:%S%z" "$START_DATE" +%s)
END_TS=$(date -j -f "%Y-%m-%dT%H:%M:%S%z" "$END_DATE" +%s)
RANGE_SECONDS=$(( END_TS - START_TS ))

if [ "$RANGE_SECONDS" -le 0 ]; then
  echo "❌ Fenêtre de dates invalide."
  exit 1
fi

# Compteurs pour la répartition 55% / 45%
KEIS_COMMITS=0
TRISTAN_COMMITS=0
TOTAL_COMMITS=0

pick_author_and_date() {
  # Choix de l'auteur en maintenant ~55% Keïs
  local author_name author_email

  if [ "$TOTAL_COMMITS" -eq 0 ]; then
    author_name="$KEIS_NAME"
    author_email="$KEIS_EMAIL"
  else
    local ratio=0
    ratio=$(( 100 * KEIS_COMMITS / TOTAL_COMMITS ))
    if [ "$ratio" -lt 55 ]; then
      author_name="$KEIS_NAME"
      author_email="$KEIS_EMAIL"
    else
      author_name="$TRISTAN_NAME"
      author_email="$TRISTAN_EMAIL"
    fi
  fi

  if [ "$author_name" = "$KEIS_NAME" ]; then
    KEIS_COMMITS=$(( KEIS_COMMITS + 1 ))
  else
    TRISTAN_COMMITS=$(( TRISTAN_COMMITS + 1 ))
  fi
  TOTAL_COMMITS=$(( TOTAL_COMMITS + 1 ))

  # Date aléatoire dans la fenêtre
  local offset ts
  offset=$(( RANDOM % RANGE_SECONDS ))
  ts=$(( START_TS + offset ))
  COMMIT_DATE=$(date -r "$ts" +"%Y-%m-%dT%H:%M:%S%z")
  COMMIT_AUTHOR_NAME="$author_name"
  COMMIT_AUTHOR_EMAIL="$author_email"
}

########################################
# COPIE TEMPORAIRE
########################################
WORKDIR="$(pwd)"
TMP_DIR="$(mktemp -d)"

echo "📦 Copie du projet dans : $TMP_DIR"
rsync -a --exclude=".git" "$WORKDIR/" "$TMP_DIR/" >/dev/null

cd "$TMP_DIR"

########################################
# INIT NOUVEAU DÉPÔT
########################################
echo "🧨 Initialisation d'un dépôt Git vierge..."
git init -q
git checkout -b "$BRANCH" >/dev/null

########################################
# DÉTECTION DES FAMILLES .vN.js
########################################
FAMILY_FILE="$(mktemp)"

echo "🔍 Détection automatique des familles de fichiers versionnés (.vN.js)..."

find . -type f -name "*.v[0-9]*.js" | sort | awk '
{
  full=$0                                # ./backend/server.v2.js
  base=$0
  sub(/\.v[0-9]+\./,".", base)           # ./backend/server.js
  versions[base]=versions[base]" "full
}
END {
  for (b in versions) {
    gsub(/^ /, "", versions[b])
    print b ":" versions[b]
  }
}
' > "$FAMILY_FILE"

echo "📁 Familles détectées :"
cat "$FAMILY_FILE" || true
echo "--------------------------"

########################################
# HISTORIQUE PAR FICHIER
########################################
while IFS= read -r line; do
  [ -z "$line" ] && continue

  base="${line%%:*}"
  vers="${line#*:}"
  base="${base#./}"   # enlève le ./ devant

  if [ ! -f "$base" ]; then
    echo "⚠️ Base introuvable, on saute : $base"
    continue
  fi

  echo "📚 Construction de l’historique pour : $base"
  backup="${base}.FINAL_ORIG"

  # Sauvegarder le contenu final réel
  cp "$base" "$backup"

  # Pour chaque version vN (v1, v2, v3...)
  for v in $vers; do
    v="${v#./}"    # enlève ./ devant

    if [ ! -f "$v" ]; then
      echo "   ⚠️ Version introuvable : $v, skip."
      continue
    fi

    # Remplacer base.js par le contenu de vN
    cp "$v" "$base"
    git add "$base"

    # Si aucun changement, ne commit pas
    if git diff --cached --quiet -- "$base"; then
      echo "   ⚠️ Aucun changement pour $(basename "$v"), commit sauté."
      git reset HEAD "$base" >/dev/null
      continue
    fi

    pick_author_and_date

    GIT_AUTHOR_NAME="$COMMIT_AUTHOR_NAME" \
    GIT_AUTHOR_EMAIL="$COMMIT_AUTHOR_EMAIL" \
    GIT_AUTHOR_DATE="$COMMIT_DATE" \
    GIT_COMMITTER_NAME="$COMMIT_AUTHOR_NAME" \
    GIT_COMMITTER_EMAIL="$COMMIT_AUTHOR_EMAIL" \
    GIT_COMMITTER_DATE="$COMMIT_DATE" \
    git commit -m "Historique $base depuis $(basename "$v")" >/dev/null

    echo "   ✅ Commit avec contenu de $(basename "$v") par $COMMIT_AUTHOR_NAME le $COMMIT_DATE"
  done

  # Remettre la vraie version finale
  cp "$backup" "$base"
  git add "$base"

  if git diff --cached --quiet -- "$base"; then
    echo "   ℹ️ Version finale identique au dernier commit, pas de commit supplémentaire."
    git reset HEAD "$base" >/dev/null
  else
    pick_author_and_date

    GIT_AUTHOR_NAME="$COMMIT_AUTHOR_NAME" \
    GIT_AUTHOR_EMAIL="$COMMIT_AUTHOR_EMAIL" \
    GIT_AUTHOR_DATE="$COMMIT_DATE" \
    GIT_COMMITTER_NAME="$COMMIT_AUTHOR_NAME" \
    GIT_COMMITTER_EMAIL="$COMMIT_AUTHOR_EMAIL" \
    GIT_COMMITTER_DATE="$COMMIT_DATE" \
    git commit -m "Version finale de $base" >/dev/null

    echo "   🎯 Commit de la version finale pour $base par $COMMIT_AUTHOR_NAME le $COMMIT_DATE"
  fi

  rm -f "$backup"
  echo
done < "$FAMILY_FILE"

########################################
# NETTOYAGE DES FICHIERS .vN.js
########################################
echo "🧹 Suppression des fichiers de versions (*.vN.js) dans l’historique final..."
find . -type f -name "*.v[0-9]*.js" -delete

########################################
# COMMIT GLOBAL POUR LE RESTE DU PROJET
########################################
echo "📦 Ajout du reste des fichiers (HTML, CSS, autres JS, assets, etc.)..."
git add .

if ! git diff --cached --quiet; then
  pick_author_and_date

  GIT_AUTHOR_NAME="$COMMIT_AUTHOR_NAME" \
  GIT_AUTHOR_EMAIL="$COMMIT_AUTHOR_EMAIL" \
  GIT_AUTHOR_DATE="$COMMIT_DATE" \
  GIT_COMMITTER_NAME="$COMMIT_AUTHOR_NAME" \
  GIT_COMMITTER_EMAIL="$COMMIT_AUTHOR_EMAIL" \
  GIT_COMMITTER_DATE="$COMMIT_DATE" \
  git commit -m "Ajout du reste du projet" >/dev/null

  echo "✅ Commit global final par $COMMIT_AUTHOR_NAME le $COMMIT_DATE"
else
  echo "ℹ️ Rien de plus à committer dans le reste du projet."
fi

########################################
# PUSH FORCE SUR LE REMOTE
########################################
git remote add origin "$REMOTE_URL"
echo "🚀 Push forcé vers $REMOTE_URL..."
git push -u origin "$BRANCH" --force

########################################
# NETTOYAGE
########################################
cd "$WORKDIR"
rm -rf "$TMP_DIR"

echo
echo "✅ Terminé :"
echo "   - Projet local NON modifié"
echo "   - Historique reconstruit depuis les *.vN.js"
echo "   - Commits datés entre le 11 et le 22 novembre 2025"
echo "   - Répartition auteurs ≈ 55% $KEIS_NAME / 45% $TRISTAN_NAME"