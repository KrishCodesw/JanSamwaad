import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
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
    const { operation, issue_ids, data: operationData } = body

    if (!operation || !issue_ids || !Array.isArray(issue_ids) || issue_ids.length === 0) {
      return NextResponse.json({ error: 'Operation and issue IDs are required' }, { status: 400 })
    }

    let results: any = { success: 0, failed: 0, errors: [] }

    switch (operation) {
      case 'update_status':
        results = await bulkUpdateStatus(supabase, issue_ids, operationData.status, user.id, operationData.notes)
        break
      
      case 'assign_department':
        results = await bulkAssignDepartment(supabase, issue_ids, operationData.department_id, operationData.assignee_id, user.id, operationData.notes)
        break
      
      case 'flag_priority':
        results = await bulkFlagPriority(supabase, issue_ids, operationData.flagged)
        break
      
      case 'add_tags':
        results = await bulkAddTags(supabase, issue_ids, operationData.tags)
        break
      
      case 'remove_tags':
        results = await bulkRemoveTags(supabase, issue_ids, operationData.tags)
        break
      
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Bulk operation completed: ${results.success} succeeded, ${results.failed} failed`,
      results
    })
    
  } catch (error) {
    console.error('Bulk operation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function bulkUpdateStatus(supabase: any, issueIds: number[], status: string, userId: string, notes?: string) {
  const validStatuses = ['active', 'under_progress', 'under_review', 'closed']
  if (!validStatuses.includes(status)) {
    return { success: 0, failed: issueIds.length, errors: ['Invalid status'] }
  }

  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const issueId of issueIds) {
    try {
      // Get current status for history
      const { data: currentIssue, error: fetchError } = await supabase
        .from('issues')
        .select('status')
        .eq('id', issueId)
        .single()

      if (fetchError) {
        failed++
        errors.push(`Issue ${issueId}: ${fetchError.message}`)
        continue
      }

      // Update status
      const { error: updateError } = await supabase
        .from('issues')
        .update({ status })
        .eq('id', issueId)

      if (updateError) {
        failed++
        errors.push(`Issue ${issueId}: ${updateError.message}`)
        continue
      }

      // Record in history
      await supabase
        .from('status_history')
        .insert({
          issue_id: issueId,
          from_status: currentIssue.status,
          to_status: status,
          notes,
          changed_by: userId
        })

      success++
    } catch (error) {
      failed++
      errors.push(`Issue ${issueId}: ${error}`)
    }
  }

  return { success, failed, errors }
}

async function bulkAssignDepartment(supabase: any, issueIds: number[], departmentId: number, assigneeId?: string, userId?: string, notes?: string) {
  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const issueId of issueIds) {
    try {
      const { error: assignError } = await supabase
        .from('assignments')
        .upsert({
          issue_id: issueId,
          department_id: departmentId,
          assignee_id: assigneeId || null,
          assigned_by: userId,
          notes
        })

      if (assignError) {
        failed++
        errors.push(`Issue ${issueId}: ${assignError.message}`)
      } else {
        success++
      }
    } catch (error) {
      failed++
      errors.push(`Issue ${issueId}: ${error}`)
    }
  }

  return { success, failed, errors }
}

async function bulkFlagPriority(supabase: any, issueIds: number[], flagged: boolean) {
  const { data: updatedIssues, error } = await supabase
    .from('issues')
    .update({ flagged })
    .in('id', issueIds)
    .select('id')

  if (error) {
    return { success: 0, failed: issueIds.length, errors: [error.message] }
  }

  return {
    success: updatedIssues?.length || 0,
    failed: issueIds.length - (updatedIssues?.length || 0),
    errors: []
  }
}

async function bulkAddTags(supabase: any, issueIds: number[], newTags: string[]) {
  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const issueId of issueIds) {
    try {
      // Get current tags
      const { data: issue, error: fetchError } = await supabase
        .from('issues')
        .select('tags')
        .eq('id', issueId)
        .single()

      if (fetchError) {
        failed++
        errors.push(`Issue ${issueId}: ${fetchError.message}`)
        continue
      }

      // Merge tags (avoid duplicates)
      const currentTags = issue.tags || []
      const mergedTags = [...new Set([...currentTags, ...newTags])]

      // Update with merged tags
      const { error: updateError } = await supabase
        .from('issues')
        .update({ tags: mergedTags })
        .eq('id', issueId)

      if (updateError) {
        failed++
        errors.push(`Issue ${issueId}: ${updateError.message}`)
      } else {
        success++
      }
    } catch (error) {
      failed++
      errors.push(`Issue ${issueId}: ${error}`)
    }
  }

  return { success, failed, errors }
}

async function bulkRemoveTags(supabase: any, issueIds: number[], tagsToRemove: string[]) {
  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const issueId of issueIds) {
    try {
      // Get current tags
      const { data: issue, error: fetchError } = await supabase
        .from('issues')
        .select('tags')
        .eq('id', issueId)
        .single()

      if (fetchError) {
        failed++
        errors.push(`Issue ${issueId}: ${fetchError.message}`)
        continue
      }

      // Remove specified tags
      const currentTags = issue.tags || []
const filteredTags = currentTags.filter((tag: string) => !tagsToRemove.includes(tag as string));

      // Update with filtered tags
      const { error: updateError } = await supabase
        .from('issues')
        .update({ tags: filteredTags })
        .eq('id', issueId)

      if (updateError) {
        failed++
        errors.push(`Issue ${issueId}: ${updateError.message}`)
      } else {
        success++
      }
    } catch (error) {
      failed++
      errors.push(`Issue ${issueId}: ${error}`)
    }
  }

  return { success, failed, errors }
}
