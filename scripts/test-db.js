// Test database connection and add sample data
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

async function testDatabase() {
  console.log('Testing database connection...')
  
  try {
    // Test connection by checking tables
    const { data: tables, error: tablesError } = await supabase
      .from('issues')
      .select('count', { count: 'exact', head: true })
    
    if (tablesError) {
      console.error('Database connection failed:', tablesError.message)
      console.log('\nMake sure you have:')
      console.log('1. Run the schema.sql in your Supabase SQL Editor')
      console.log('2. Added the correct SUPABASE_SERVICE_ROLE_KEY to .env.local')
      return false
    }
    
    console.log('✅ Database connection successful!')
    console.log(`📊 Current issues count: ${tables || 0}`)
    
    // Add sample departments if none exist
    const { data: deptCount } = await supabase
      .from('departments')
      .select('count', { count: 'exact', head: true })
    
    if (deptCount === 0) {
      console.log('Adding sample departments...')
      const { error: deptError } = await supabase
        .from('departments')
        .insert([
          { name: 'Public Works' },
          { name: 'Sanitation' },
          { name: 'Transportation' },
          { name: 'Parks & Recreation' }
        ])
      
      if (!deptError) {
        console.log('✅ Sample departments added!')
      }
    }
    
    return true
  } catch (error) {
    console.error('Test failed:', error.message)
    return false
  }
}

testDatabase()
