#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export PATH="$HOME/.cargo/bin:$PATH"

if ! command -v cargo >/dev/null 2>&1; then
  if [[ -f "$HOME/.cargo/env" ]]; then
    # shellcheck source=/dev/null
    . "$HOME/.cargo/env"
  fi
fi

if ! command -v cargo >/dev/null 2>&1; then
  echo "cargo not found on PATH" >&2
  exit 127
fi

echo "Running Rust tests (src-tauri)..."
(
  cd "$repo_root/src-tauri"
  cargo test
)

echo "Running frontend helper tests..."
(
  cd "$repo_root"
  mapfile -t node_tests < <(find tests -type f -name "*.test.mjs" | sort)
  node --test "${node_tests[@]}"
)

echo "All tests passed."
