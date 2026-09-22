#!/usr/bin/env bash
# Headless smoke test for the site. No dependencies beyond node and Chrome.
#
#   ./tools/check.sh
#
# Drives a real Chrome over the DevTools Protocol and asserts the things that
# have actually broken here before: console output, third-party requests,
# eager video fetches, scroll reveals, the work filter, the case dialog,
# the theme toggle, anchor scrolling and horizontal overflow.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=${PORT:-8777}
CDP_PORT=${CDP_PORT:-9333}
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
PROFILE=$(mktemp -d)

python3 -m http.server "$PORT" >/dev/null 2>&1 & SRV=$!
"$CHROME" --headless=new --disable-gpu --no-sandbox \
  --remote-debugging-port="$CDP_PORT" --user-data-dir="$PROFILE" about:blank >/dev/null 2>&1 & CHR=$!
# The whole cleanup is wrapped in one subshell with its own `|| true`: under
# set -e, a failing command inside an EXIT trap (e.g. rm racing Chrome's own
# profile-dir writes as it shuts down) can silently override an already
# "all suites passed" exit status. Don't let cleanup flakiness fail the run.
trap '{ kill $SRV $CHR; sleep 0.3; rm -rf "$PROFILE"; } >/dev/null 2>&1 || true' EXIT
sleep 3

echo "── desktop 1280x900 ─────────────────────────────"
CDP_PORT=$CDP_PORT PAGE="http://localhost:$PORT/" node tools/qa.mjs || FAILED=1

echo "── mobile 390x844 ───────────────────────────────"
CDP_PORT=$CDP_PORT PAGE="http://localhost:$PORT/" W=390 H=844 node tools/qa-rm.mjs || FAILED=1

echo "── prefers-reduced-motion: reduce ───────────────"
CDP_PORT=$CDP_PORT PAGE="http://localhost:$PORT/" W=1280 H=900 RM=1 node tools/qa-rm.mjs || FAILED=1

if [ -z "${FAILED:-}" ]; then
  echo "all suites passed"
  exit 0
else
  echo "some suites failed"
  exit 1
fi
