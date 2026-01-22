#!/bin/bash

# Conversure - Production Deployment Script
# Usage: ./scripts/deploy-production.sh

set -e

echo "🚀 Starting Conversure Production Deployment..."

# 1. Environment Check
echo "📋 Checking environment variables..."
required_vars=("DATABASE_URL" "NEXTAUTH_URL" "NEXTAUTH_SECRET" "CHATWOOT_API_TOKEN")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set"
        exit 1
    fi
done
echo "✅ Environment variables validated"

# 2. Database Migration
echo "🗄️  Running database migrations..."
npx prisma migrate deploy
echo "✅ Migrations completed"

# 3. Build Next.js
echo "🏗️  Building production bundle..."
npm run build
echo "✅ Build completed"

# 4. Database Seed (First-time only)
if [ "$SEED_DB" = "true" ]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
    echo "✅ Seed completed"
fi

# 5. Health Check
echo "🏥 Running health checks..."
npm run test:health
echo "✅ Health checks passed"

echo "✅ Deployment complete!"
echo "📊 Next steps:"
echo "   1. Configure Chatwoot webhook URL"
echo "   2. Test with real WhatsApp message"
echo "   3. Monitor logs for 24 hours"
