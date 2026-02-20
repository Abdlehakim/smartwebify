#!/usr/bin/env bash
set -euo pipefail
node -r module-alias/register dist/app.js & API_PID=$!
node -r module-alias/register dist/jobs/invoiceWorker.js & WORKER_PID=$!
trap "kill -TERM $API_PID $WORKER_PID; wait" TERM INT
wait -n "$API_PID" "$WORKER_PID"
EXIT=$?
kill -TERM "$API_PID" "$WORKER_PID" || true
wait || true
exit "$EXIT"
