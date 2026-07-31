#!/bin/zsh
set -euo pipefail

gateway_dir="${0:A:h}"
env_file="$gateway_dir/.env"

if [[ ! -f "$env_file" ]]; then
  print -u2 "Missing $env_file. Copy .env.example and fill in the two secrets."
  exit 1
fi

set -a
source "$env_file"
set +a

exec /usr/local/bin/node "$gateway_dir/server.mjs"
