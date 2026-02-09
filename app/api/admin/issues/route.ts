import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// /api/admin/issues/route.ts
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const deptId = searchParams.get('department')
  const statusFilter = searchParams.get('status')

  let query = supabase
    .from('issues')
    .select(`
      *,
      reporter:profiles!issues_reporter_id_fkey(display_name),
      department:departments(id,name),
      images:issue_images(url),
      vote_count:votes(count),
      assignment:assignments(
        notes,
        assignee:profiles!assignments_assignee_id_fkey(display_name)
      )
    `)

  // Priority filtering to speed up the query
  if (deptId) query = query.eq('department_id', deptId)
  if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter)

  const { data: issues, error } = await query
    .order('created_at', { ascending: false })
    .limit(50) // Strictly limit for performance

  if (error) {
    console.error('Admin issues fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(issues || [])
}