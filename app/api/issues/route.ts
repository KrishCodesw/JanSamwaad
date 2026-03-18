import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { FilterSpamRegex } from '@/lib/spam_filter'


export async function POST(req: Request) {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  //Check whether user is banned 
  const { data: profile } = await admin
    .from('profiles')
    .select('is_banned, spam_strikes')
    .eq('id', user.id)
    .single()

  if (profile?.is_banned) {
    return NextResponse.json(
      { error: 'Your account has been suspended for violating community guidelines.' },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const {
    description,
    flagged = false,
    tags = [],
    latitude,
    longitude,
    images = [],
    reporterEmail,
  } = body

  if (
    typeof description !== 'string' ||
    typeof latitude !== 'number' ||
    typeof longitude !== 'number'
  ) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  //Rate limit 

  const twoMinutesAgo=new Date(Date.now()-2*60*1000).toISOString()
  const { count: recentIssuesCount } = await admin
    .from('issues')
    .select('*', { count: 'exact', head: true })
    .eq('reporter_id', user.id) // Checks this specific user
    .gte('created_at', twoMinutesAgo)

  if (recentIssuesCount && recentIssuesCount >= 3) {
    await addStrikeToUser(admin, user.id, profile?.spam_strikes)
    return NextResponse.json(
      { error: 'You are submitting issues too fast. Please wait a few minutes.' }, 
      { status: 429 }
    )
  }

  const fastCheck = FilterSpamRegex(description)
  
  if (fastCheck.isSpam) {
    await addStrikeToUser(admin, user.id, profile?.spam_strikes)
    return NextResponse.json(
      { error: `Submission rejected: ${fastCheck.reason}` }, 
      { status: 406 }
    )
  }



  // Insert issue
  const { data: issue, error } = await admin
    .from('issues')
    .insert([{ description, flagged, tags, latitude, longitude, reporter_email: user.email,reporter_id:user.id,status: 'pending_moderation' }])
    .select('*, departments(*)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Insert images
  if (Array.isArray(images) && images.length) {
    const rows = images.map((url: string) => ({ issue_id: issue.id, url }))
    const { error: imgErr } = await admin.from('issue_images').insert(rows)
    if (imgErr) console.error('Image insert error', imgErr)
  }

  // Route assignment via RPC
  const { data: region, error: routeErr } = await admin.rpc('route_issue_by_point', {
    in_lng: longitude,
    in_lat: latitude,
  })
  if (!routeErr && region && region.department_id) {
    // Upsert-like behavior: try insert; if conflict, ignore
    const { error: assignErr } = await admin
      .from('assignments')
      .insert([{ issue_id: issue.id, department_id: region.department_id }])
    if (assignErr && !assignErr.message.toLowerCase().includes('duplicate')) {
      console.error('Assignment insert error', assignErr)
    }
  }

  // Basic anonymous dedupe support: store hashed IP on votes when voting later

  return NextResponse.json({ id: issue.id })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const statusFilter = searchParams.get('status')
  
  const supabase = await createClient()
  
  try {
    let query = supabase
      .from('issues')
      .select(`
        *,
        images:issue_images(url),
        votes(count),
        department:departments(*),
        status_changes:status_history(
          from_status,
          to_status,
          changed_at,
          notes,
          changed_by,
          profiles!status_history_changed_by_fkey(display_name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    } else {
      // Hide unmoderated and spam issues from the "All Status" public feed
      query = query.not('status', 'in', '("pending_moderation","spam")')
    }
    
    const { data: issues, error } = await query
    
    if (error) {
      console.error('Issues fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 })
    }
    
    // Process vote counts to be numbers instead of objects
    const processedIssues = (issues || []).map(issue => ({
      ...issue,
      vote_count: issue.votes?.[0]?.count || 0
    }))
    
    return NextResponse.json(processedIssues)
  } catch (error) {
    console.error('Issues error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


async function addStrikeToUser(adminClient: any, userId: string, currentStrikes: number = 0) {
  const newStrikes = currentStrikes + 1;
  const isBanned = newStrikes >= 3;

  await adminClient
    .from("profiles")
    .update({ 
      spam_strikes: newStrikes,
      is_banned: isBanned 
    })
    .eq("id", userId);
}