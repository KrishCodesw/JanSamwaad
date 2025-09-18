// Setup database schema - creates all tables, functions, and policies
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

async function executeSQL(sql) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql })
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.log('SQL execution response:', error)
      return false
    }
    return true
  } catch (error) {
    console.log('SQL execution error:', error.message)
    return false
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up database schema...')
  
  try {
    // Read the schema.sql file
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('📄 Read schema.sql file')
    console.log('📝 Executing SQL schema...')
    
    // Try to execute the full schema at once
    const success = await executeSQL(schema)
    
    if (!success) {
      console.log('⚠️  Full schema execution failed. Please copy the SQL from supabase/schema.sql')
      console.log('   and paste it into your Supabase SQL Editor manually.')
      console.log('\n📋 Schema content:')
      console.log('---')
      console.log(schema.substring(0, 500) + '...')
      console.log('---')
      return
    }
    
    // Test if tables were created by checking one of them
    const { data: testData, error: testError } = await supabase
      .from('issues')
      .select('count', { count: 'exact', head: true })
    
    if (testError) {
      throw new Error(`Tables not created properly: ${testError.message}`)
    }
    
    console.log('✅ Database schema setup completed!')
    
    // Add sample departments
    console.log('📦 Adding sample departments...')
    const { data: existingDepts } = await supabase
      .from('departments')
      .select('id')
    
    if (!existingDepts || existingDepts.length === 0) {
      const { error: deptError } = await supabase
        .from('departments')
        .insert([
          { name: 'Public Works' },
          { name: 'Sanitation' },
          { name: 'Transportation' },
          { name: 'Parks & Recreation' },
          { name: 'Water & Utilities' }
        ])
      
      if (deptError) {
        console.log('⚠️  Could not add departments:', deptError.message)
      } else {
        console.log('✅ Sample departments added!')
      }
    } else {
      console.log('ℹ️  Departments already exist, skipping...')
    }
    
    console.log('🎉 Database setup complete!')
    console.log('\nYou can now:')
    console.log('1. Run: npm run dev')
    console.log('2. Test the issue reporting at: http://localhost:3000/report')
    console.log('3. View issues at: http://localhost:3000/issues')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    console.log('\nPlease manually run the SQL in supabase/schema.sql in your Supabase SQL Editor')
  }
}

setupDatabase()
