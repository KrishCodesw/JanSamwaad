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

const sampleAnnouncements = [
  {
    title: "Road Maintenance Work - Highway 101",
    content: "We will be conducting routine road maintenance on Highway 101 from 10 PM to 6 AM starting tomorrow. Expect delays and use alternate routes when possible. Emergency lanes will remain open.",
    type: "maintenance",
    priority: "high"
  },
  {
    title: "New Public Health Guidelines",
    content: "Following recent health advisories, all public facilities will implement enhanced safety protocols. Please carry valid ID and follow posted instructions when visiting government offices.",
    type: "info",
    priority: "normal"
  },
  {
    title: "Water Supply Interruption - Sector 15",
    content: "Water supply will be temporarily interrupted in Sector 15 tomorrow from 8 AM to 4 PM due to pipeline upgrades. Water tankers will be deployed at key locations.",
    type: "alert",
    priority: "urgent"
  },
  {
    title: "Online Tax Filing Extended",
    content: "Due to high demand, the deadline for online tax filing has been extended by 15 days. Citizens can visit our website or contact local offices for assistance.",
    type: "general",
    priority: "normal"
  },
  {
    title: "Public Transport Schedule Changes",
    content: "Starting Monday, bus routes 45A, 67B, and 89C will have modified schedules. Check the updated timetables at bus stops or download our mobile app for real-time updates.",
    type: "info",
    priority: "low"
  }
]

async function createTestAnnouncements() {
  console.log('🔧 Creating test announcements...\n')
  
  try {
    // Find an admin user to attribute announcements to
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role')
      .in('role', ['admin', 'official'])
      .limit(1)
    
    if (profilesError) throw profilesError
    
    if (profiles.length === 0) {
      console.log('❌ No admin/official profiles found. Run create-admin.js first.')
      return
    }
    
    const createdBy = profiles[0].id
    console.log(`✅ Using admin profile: ${createdBy}`)
    
    // Insert announcements
    const announcementsToInsert = sampleAnnouncements.map(announcement => ({
      ...announcement,
      created_by: createdBy,
      is_active: true
    }))
    
    const { data, error } = await supabase
      .from('announcements')
      .insert(announcementsToInsert)
      .select()
    
    if (error) throw error
    
    console.log('🎉 Test announcements created successfully!')
    console.log(`📝 Created ${data.length} announcements:`)
    
    data.forEach((announcement, i) => {
      console.log(`  ${i + 1}. ${announcement.title} (${announcement.type}, ${announcement.priority})`)
    })
    
    console.log('\n🌐 Visit http://localhost:3000 to see the announcements!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createTestAnnouncements()
