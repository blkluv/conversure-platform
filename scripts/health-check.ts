/**
 * Health Check Script - Production Monitoring
 * Run: npm run test:health
 */

import { db } from '@/lib/db'

async function healthCheck() {
    console.log('🏥 Running Conversure Health Checks...\n')

    const checks = {
        database: false,
        migrations: false,
        chatwoot: false,
    }

    try {
        // 1. Database Connection
        console.log('1️⃣  Checking database connection...')
        await db.$queryRaw`SELECT 1`
        checks.database = true
        console.log('   ✅ Database connected\n')
    } catch (error) {
        console.error('   ❌ Database connection failed:', error)
    }

    try {
        // 2. Schema Validation
        console.log('2️⃣  Validating database schema...')
        const companyCount = await db.company.count()
        const userCount = await db.user.count()
        console.log(`   ✅ Schema valid (${companyCount} companies, ${userCount} users)\n`)
        checks.migrations = true
    } catch (error) {
        console.error('   ❌ Schema validation failed:', error)
    }

    try {
        // 3. Chatwoot Configuration
        console.log('3️⃣  Checking Chatwoot configuration...')
        const hasChatwoot = !!process.env.CHATWOOT_API_TOKEN
        if (hasChatwoot) {
            console.log('   ✅ Chatwoot credentials configured\n')
            checks.chatwoot = true
        } else {
            console.log('   ⚠️  Chatwoot not configured (optional)\n')
        }
    } catch (error) {
        console.error('   ❌ Chatwoot check failed:', error)
    }

    // Summary
    console.log('\n📊 Health Check Summary:')
    console.log(`   Database: ${checks.database ? '✅' : '❌'}`)
    console.log(`   Migrations: ${checks.migrations ? '✅' : '❌'}`)
    console.log(`   Chatwoot: ${checks.chatwoot ? '✅' : '⚠️'}`)

    const allCriticalPassed = checks.database && checks.migrations
    if (allCriticalPassed) {
        console.log('\n✅ All critical checks passed!')
        process.exit(0)
    } else {
        console.log('\n❌ Some checks failed!')
        process.exit(1)
    }
}

healthCheck()
