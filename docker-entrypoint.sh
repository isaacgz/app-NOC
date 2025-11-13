#!/bin/sh
# ============================================================
# Docker Entrypoint Script for NOC Backend
# ============================================================

set -e

echo "🔄 Waiting for PostgreSQL to be ready..."

# Wait for PostgreSQL to be ready
until npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || npx prisma migrate deploy 2>/dev/null; do
  echo "⏳ PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"
echo "🚀 Running Prisma migrations..."

# Run migrations
npx prisma migrate deploy || {
  echo "⚠️  Migration failed, trying db push instead..."
  npx prisma db push --skip-generate --accept-data-loss
}

echo "✅ Migrations completed successfully!"
echo "🎯 Starting NOC Backend..."

# Start the application
exec node dist/app.js
