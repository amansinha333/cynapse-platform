#!/usr/bin/env bash
set -euo pipefail
exec uvicorn main:app --host 0.0.0.0 --port "${PORT}" --workers 1 --limit-concurrency 15
