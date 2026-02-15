export const dynamic = 'force-dynamic';

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function createAdmin(email) {
  console.log(`🔧 Creating admin profile for: ${email}`)
  
  try {
    // Find the user by email
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) throw usersError
    
    const user = users.users.find(u => u.email === email)
    if (!user) {
      console.log('❌ User not found. Please sign up first at http://localhost:3000')
      return
    }
    
    console.log(`✅ Found user: ${user.id}`)
    
    // Update their profile to admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        role: 'admin',
        display_name: user.user_metadata?.display_name || email.split('@')[0]
      })
      .select()
    
    if (profileError) throw profileError
    
    console.log('✅ Admin profile created successfully!')
    console.log('📝 Profile:', profile)
    console.log('\n🎉 You can now access the admin portal!')
    console.log('🌐 Go to: http://localhost:3000/admin/issues')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

const email = process.argv[2]
if (!email) {
  console.log('❌ Please provide an email address')
  console.log('Usage: node scripts/create-admin.js user@example.com')
  process.exit(1)
}

createAdmin(email)
