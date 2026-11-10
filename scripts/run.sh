#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INDEX="$ROOT/web/index.html"

if command -v open >/dev/null 2>&1; then
  open "$INDEX"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$INDEX"
else
  echo "No browser opener found. Open this file in your browser: $INDEX"
  exit 1
fi
