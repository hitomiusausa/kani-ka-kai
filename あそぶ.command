#!/bin/zsh
# Double-click in Finder to open the local sample.
cd -- "$(dirname -- "$0")" || exit 1
if curl --max-time 2 -fsS http://127.0.0.1:4288/ 2>/dev/null | grep -q 'かにかかい'; then
  open 'http://127.0.0.1:4288/'
  exit 0
fi
if ! command -v npm >/dev/null 2>&1; then
  print 'Node.js / npm が必要です。README.md を確認してください。'
  read -r '?Enterで閉じます。'
  exit 1
fi
if [[ ! -d node_modules ]]; then
  npm ci --no-fund --no-audit || exit 1
fi
(sleep 2; open 'http://127.0.0.1:4288/') &
npm run dev
