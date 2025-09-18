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

async function checkIssues() {
  console.log('🔍 Checking issues in database...\n')
  
  try {
    // Check total issues count
    const { count, error: countError } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
    
    if (countError) throw countError
    
    console.log(`📊 Total issues in database: ${count}`)
    
    if (count === 0) {
      console.log('❌ No issues found! This explains why the Issues Management tab is empty.')
      console.log('\n🔧 Would you like me to create some test issues?')
      console.log('Run: node scripts/create-test-issues.js')
      return
    }
    
    // Get all issues with details
    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select(`
        *,
        images:issue_images(url),
        vote_count:votes(count)
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (issuesError) throw issuesError
    
    console.log('\n📋 Recent issues:')
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. Issue #${issue.id}`)
      console.log(`     Status: ${issue.status}`)
      console.log(`     Description: ${issue.description.substring(0, 100)}...`)
      console.log(`     Tags: ${issue.tags.join(', ')}`)
      console.log(`     Flagged: ${issue.flagged}`)
      console.log(`     Reporter: ${issue.reporter_email}`)
      console.log(`     Created: ${new Date(issue.created_at).toLocaleDateString()}`)
      console.log(`     Votes: ${issue.vote_count?.[0]?.count || 0}`)
      console.log()
    })
    
    // Check by status
    console.log('📈 Issues by status:')
    const statusCounts = await Promise.all([
      'active', 'under_progress', 'under_review', 'closed'
    ].map(async (status) => {
      const { count } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .eq('status', status)
      return { status, count }
    }))
    
    statusCounts.forEach(({ status, count }) => {
      console.log(`  ${status}: ${count}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkIssues()
