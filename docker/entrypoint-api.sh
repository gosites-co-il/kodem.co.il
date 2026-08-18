#!/bin/sh
set -e

if [ -d "./prisma" ]; then
  npx prisma migrate deploy --schema=./prisma/schema.prisma
fi

exec node main.js
