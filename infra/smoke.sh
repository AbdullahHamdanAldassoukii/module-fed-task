#!/bin/sh
set -eu

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

env_expected="${1:-production}"

echo "host config:"
curl -sf http://localhost:3000/config.json | grep -q "\"env\": *\"${env_expected}\"" || fail "host config env=${env_expected}"
echo "  ok env=${env_expected}"

echo "remote manifest:"
curl -sfI -H 'Origin: http://localhost:3000' http://localhost:3001/mf-manifest.json | grep -qi 'access-control-allow-origin: http://localhost:3000' || fail "remote manifest CORS"
echo "  ok cors"
curl -sfI http://localhost:3001/mf-manifest.json | grep -qi 'cache-control: no-cache' || fail "remote manifest cache-control"
echo "  ok no-cache on manifest"

curl -sfI -H 'Origin: http://localhost:3000' http://localhost:3001/mf-manifest.json | grep -qi '^vary: .*origin' || fail "remote manifest Vary: Origin"
echo "  ok vary"

echo "host image:"
status=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/mockServiceWorker.js)
[ "$status" = "404" ] || fail "mockServiceWorker.js is served (HTTP $status)"
echo "  ok no mock service worker"

echo "mock api:"
curl -sf -X POST http://localhost:3002/api/applications -H 'content-type: application/json' -d '{"passport":{},"idInfo":{}}' | grep -q referenceId || fail "mock API submission"
echo "  ok 201"

echo "all good"
