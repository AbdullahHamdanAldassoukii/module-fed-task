#!/bin/sh
set -eu

ENV_NAME="${APP_ENV:-production}"
SRC="/etc/app-config/${ENV_NAME}.json"

if [ ! -f "$SRC" ]; then
  echo "Unknown APP_ENV '${ENV_NAME}' (no ${SRC})" >&2
  exit 1
fi

cp "$SRC" /usr/share/nginx/html/config.json
echo "Serving config for APP_ENV=${ENV_NAME}"
