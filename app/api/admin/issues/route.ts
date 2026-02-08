import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  const categoryFilter = searchParams.get('category')
  const departmentFilter = searchParams.get('department')
  const limit = parseInt(searchParams.get('limit') || '100')

  try {
    // Check if user is admin/official
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, display_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['admin', 'official'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied - Admin/Official access required' }, { status: 403 })
    }
// /api/admin/issues/route.ts

// Change this line to simplify the relationship paths
// /api/admin/issues/route.ts

// /api/admin/issues/route.ts

// /api/admin/issues/route.ts

let query = supabase
  .from('issues')
  .select(`
    *,
    images:issue_images(url),
    vote_count:votes(count),
    reporter:profiles!issues_reporter_id_fkey(display_name),
    department:departments(name),
    assignment:assignments(
      assigned_at,
      notes,
      assignee:profiles!assignments_assignee_id_fkey(display_name)
    )
  `)
  .order('flagged', { ascending: false })
  .order('created_at', { ascending: false })
  .limit(limit);



    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (categoryFilter && categoryFilter !== 'all') {
      query = query.contains('tags', [categoryFilter])
    }

    const { data: issues, error } = await query

    if (error) {
      console.error('Admin issues fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 })
    }

    return NextResponse.json(issues || [])
    
  } catch (error) {
    console.error('Admin issues error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

