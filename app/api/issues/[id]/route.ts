import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: idParam } = await params
    const id = Number(idParam)
    
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    console.log(`Fetching issue with ID: ${id}`)

    // Get the issue
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .single()

    if (issueError) {
      console.log('Issue not found:', issueError.message)
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    // Get the images
    const { data: images, error: imagesError } = await supabase
      .from('issue_images')
      .select('*')
      .eq('issue_id', id)

    if (imagesError) {
      console.log('Error fetching images:', imagesError.message)
    }

    // Get vote count
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('id')
      .eq('issue_id', id)

    if (votesError) {
      console.log('Error fetching votes:', votesError.message)
    }

    // Get history
    const { data: history, error: historyError } = await supabase
      .from('status_history')
      .select('*')
      .eq('issue_id', id)
      .order('changed_at', { ascending: false })

    if (historyError) {
      console.log('Error fetching history:', historyError.message)
    }

    // Get assignment (optional)
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('issue_id', id)
      .single()

    // Don't fail if assignment doesn't exist
    if (assignmentError && assignmentError.code !== 'PGRST116') {
      console.log('Error fetching assignment:', assignmentError.message)
    }

    const response = {
      issue,
      images: images || [],
      votes: votes?.length || 0,
      history: history || [],
      assignment: assignment || null
    }

    console.log(`Successfully fetched issue ${id}:`, {
      hasIssue: !!issue,
      imageCount: images?.length || 0,
      voteCount: votes?.length || 0
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in /api/issues/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

