#!/usr/bin/env bash
# Guard check script to verify Python imports, syntax, and undefined names before pushing.
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export DATABASE_URL="${DATABASE_URL:-postgresql+asyncpg://user:pass@localhost:5432/db}"
export PYTHONPATH="${BACKEND_DIR}:${PYTHONPATH:-}"

echo "1. Checking api.index import..."
python3 -c "import api.index"
echo "✓ api.index imported successfully"

echo "2. Compiling python source files..."
python3 -m compileall -q "${BACKEND_DIR}/app" "${BACKEND_DIR}/api"
echo "✓ compileall passed"

echo "3. Checking for undefined names..."
PYFLAKES_BIN=""
if python3 -m pyflakes --version >/dev/null 2>&1; then
  PYFLAKES_BIN="python3 -m pyflakes"
elif command -v pyflakes >/dev/null 2>&1; then
  PYFLAKES_BIN="pyflakes"
fi

if [ -n "$PYFLAKES_BIN" ]; then
  UNDEFINED=$($PYFLAKES_BIN "${BACKEND_DIR}/app" "${BACKEND_DIR}/api" 2>&1 | grep "undefined name" || true)
  if [ -n "$UNDEFINED" ]; then
    echo "❌ Undefined names found:"
    echo "$UNDEFINED"
    exit 1
  fi
  echo "✓ pyflakes: no undefined names found"
else
  echo "⚠ pyflakes not found in current environment. Install via 'pip install pyflakes' for undefined name checks."
fi

echo "All import checks passed!"
