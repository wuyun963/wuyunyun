#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing all dependencies (including dev)..."
pnpm install --prefer-offline --reporter=append-only

echo "Ensuring TypeScript is available..."
pnpm add -D typescript@5.9.3 --reporter=append-only 2>/dev/null || true

echo "Installing missing typescript globally as fallback..."
if ! [ -d "node_modules/typescript" ]; then
  echo "Installing typescript as a regular dependency..."
  pnpm add typescript@5.9.3 --reporter=append-only
fi

echo "Building the Next.js project..."
pnpm next build

echo "Bundling server with tsup..."
pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

echo "Build completed successfully!"
