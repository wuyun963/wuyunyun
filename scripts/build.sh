#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

# Vercel 已经在外部执行过 pnpm install 并安装了所有依赖（包括 dev）。
# 在脚本里再次执行 pnpm install 会因为 NODE_ENV=production 移除 devDependencies，
# 反而导致 babel 插件、TypeScript 等开发期依赖消失，引发 build 失败。
# 因此这里不再重复 install，只做存在性检查与兜底。

echo "Checking TypeScript availability..."
if [ ! -d "node_modules/typescript" ]; then
  echo "TypeScript missing, installing as a regular dependency..."
  pnpm add typescript@5.9.3 --reporter=append-only
else
  echo "TypeScript already available."
fi

# 确保 devDependencies 仍存在（防止上游 pnpm install 阶段被剥离过）
echo "Ensuring devDependencies are present..."
if [ ! -d "node_modules/@react-dev-inspector/babel-plugin" ]; then
  echo "@react-dev-inspector/babel-plugin missing, reinstalling..."
  pnpm add -D @react-dev-inspector/babel-plugin@2.0.1 --reporter=append-only
fi
if [ ! -d "node_modules/@react-dev-inspector/middleware" ]; then
  echo "@react-dev-inspector/middleware missing, reinstalling..."
  pnpm add -D @react-dev-inspector/middleware@2.0.1 --reporter=append-only
fi

echo "Building the Next.js project..."
pnpm next build

echo "Build completed successfully!"
