#!/usr/bin/env bash
# Relance la suite (ou les fichiers passés en argument) sous plusieurs locales
# et fuseaux pour débusquer les tests dépendants de l'environnement.
# Usage : bash vitest-locales.sh [fichiers de test...]
set -u

FILES=("$@")
FAIL=0

run() {
  local label="$1"; shift
  echo "=== $label ==="
  if env "$@" npx vitest run "${FILES[@]}" >/dev/null 2>&1; then
    echo "OK"
  else
    echo "ÉCHEC — relancer pour le détail : env $* npx vitest run ${FILES[*]:-}"
    FAIL=1
  fi
}

run "en-US (référence)"        LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
run "fr-FR (espace insécable)" LANG=fr_FR.UTF-8 LC_ALL=fr_FR.UTF-8
run "de-DE (séparateur point)" LANG=de_DE.UTF-8 LC_ALL=de_DE.UTF-8
run "TZ Pacific/Kiritimati (UTC+14)" TZ=Pacific/Kiritimati LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
run "TZ Pacific/Niue (UTC-11)"       TZ=Pacific/Niue LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8

if [ "$FAIL" -eq 0 ]; then
  echo "--- Tous les environnements passent : suite robuste locale/TZ. ---"
else
  echo "--- Au moins un environnement échoue : voir SKILL.md §2 pour les corrections. ---"
fi
exit "$FAIL"
