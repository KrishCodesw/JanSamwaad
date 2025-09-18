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

async function checkIssueImages() {
  console.log('🔍 Checking issue images in database...\n')
  
  try {
    // Check all issues with their images
    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select(`
        id,
        description,
        images:issue_images(id, url, width, height)
      `)
      .order('id')
    
    if (issuesError) throw issuesError
    
    console.log(`📊 Found ${issues.length} issues:\n`)
    
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. Issue #${issue.id}`)
      console.log(`   Description: ${issue.description.substring(0, 60)}...`)
      console.log(`   Images: ${issue.images?.length || 0}`)
      
      if (issue.images && issue.images.length > 0) {
        issue.images.forEach((image, j) => {
          console.log(`     ${j + 1}. ID: ${image.id}, URL: ${image.url}`)
          console.log(`        Size: ${image.width || 'unknown'}x${image.height || 'unknown'}`)
        })
      } else {
        console.log(`     ❌ No images found`)
      }
      console.log()
    })
    
    // Check raw issue_images table
    console.log('📸 Raw issue_images table:')
    const { data: allImages, error: imagesError } = await supabase
      .from('issue_images')
      .select('*')
      .order('issue_id')
    
    if (imagesError) throw imagesError
    
    if (allImages.length === 0) {
      console.log('❌ No images in issue_images table at all!')
    } else {
      allImages.forEach((image, i) => {
        console.log(`  ${i + 1}. Issue #${image.issue_id} - ${image.url}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkIssueImages()
