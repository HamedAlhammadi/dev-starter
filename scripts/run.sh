#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-8080}"

if ! command -v java >/dev/null 2>&1 || ! command -v javac >/dev/null 2>&1; then
  echo "Java 17 or newer (including javac) is required." >&2
  exit 1
fi

JAVA_VERSION="$(java -version 2>&1 | head -n 1 | sed -E 's/.*version "([0-9]+).*/\1/')"
if [[ "$JAVA_VERSION" -lt 17 ]]; then
  echo "Java 17 or newer is required (found Java $JAVA_VERSION)." >&2
  exit 1
fi

mkdir -p "$ROOT/build" "$ROOT/data"
javac --release 17 -d "$ROOT/build" "$ROOT/src/main/java/dev/focusboard/FocusBoardServer.java"
cd "$ROOT"
exec java -Dfocusboard.root="$ROOT" -cp "$ROOT/build" dev.focusboard.FocusBoardServer "$PORT"
