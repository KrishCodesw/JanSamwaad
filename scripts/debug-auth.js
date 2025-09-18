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

async function debugAuth() {
  console.log('🔍 Debugging authentication and admin setup...\n')
  
  try {
    // Check all users
    console.log('📋 All auth users:')
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) throw usersError
    
    users.users.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.email} (${user.id})`)
    })
    console.log()
    
    // Check profiles table
    console.log('👤 All profiles:')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) throw profilesError
    
    profiles.forEach((profile, i) => {
      console.log(`  ${i + 1}. ${profile.id} - Role: ${profile.role} - Name: ${profile.display_name || 'N/A'}`)
    })
    console.log()
    
    // Check if there are any admin users
    const adminProfiles = profiles.filter(p => p.role === 'admin' || p.role === 'official')
    console.log(`🛡️  Admin/Official profiles found: ${adminProfiles.length}`)
    
    if (adminProfiles.length === 0) {
      console.log('❌ No admin users found! This is why you get 403 errors.')
      console.log('\n🔧 Would you like me to create an admin profile?')
      console.log('Run: node scripts/create-admin.js [email]')
    } else {
      console.log('✅ Admin users found:')
      adminProfiles.forEach(profile => {
        const user = users.users.find(u => u.id === profile.id)
        console.log(`  - ${user?.email} (${profile.role})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

debugAuth()
