import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const issueId = parseInt(id)
  
  if (!Number.isFinite(issueId)) {
    return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 })
  }

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

    const body = await request.json()
    const { status, notes, department_id, assignee_id } = body

    // Validate status
    const validStatuses = ['active', 'under_progress', 'under_review', 'closed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get current issue to track status change
    const { data: currentIssue, error: fetchError } = await supabase
      .from('issues')
      .select('status')
      .eq('id', issueId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    // Update issue status
    const { error: updateError } = await supabase
      .from('issues')
      .update({ status })
      .eq('id', issueId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 })
    }

    // Record status change in history
    const { error: historyError } = await supabase
      .from('status_history')
      .insert({
        issue_id: issueId,
        from_status: currentIssue.status,
        to_status: status,
        notes,
        changed_by: user.id
      })

    if (historyError) {
      console.error('History error:', historyError)
    }

    // Update or create assignment if provided
    if (department_id) {
      const { error: assignError } = await supabase
        .from('assignments')
        .upsert({
          issue_id: issueId,
          department_id,
          assignee_id: assignee_id || null,
          assigned_by: user.id,
          notes
        })

      if (assignError) {
        console.error('Assignment error:', assignError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Issue status updated to ${status}`,
      previous_status: currentIssue.status,
      new_status: status
    })
    
  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
