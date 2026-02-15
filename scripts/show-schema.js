export const dynamic = 'force-dynamic';
// Display the schema for manual copy-paste into Supabase SQL Editor
const fs = require('fs')
const path = require('path')

console.log('🗄️  CIVIC ISSUE REPORTING DATABASE SETUP')
console.log('=' * 50)
console.log()
console.log('📋 Copy the SQL below and paste it into your Supabase SQL Editor:')
console.log('   1. Go to https://supabase.com/dashboard')
console.log('   2. Select your project')
console.log('   3. Go to SQL Editor')
console.log('   4. Paste this SQL and click RUN')
console.log()
console.log('=' * 50)
console.log()

try {
  const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')
  console.log(schema)
} catch (error) {
  console.error('Could not read schema file:', error.message)
}

console.log()
console.log('=' * 50)
console.log('✅ After running the SQL above, run: node scripts/test-db.js')
console.log('📱 Then start the app with: npm run dev')
