import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  try {
    // Get active announcements
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select(`
        *,
        department:departments(name),
        creator:profiles(display_name)
      `)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Announcements fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
    }

    return NextResponse.json(announcements || [])
    
  } catch (error) {
    console.error('Announcements error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['admin', 'official'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied - Admin/Official access required' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, type, priority, department_id, expires_at } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // Insert announcement
    const { data: announcement, error: insertError } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        type: type || 'general',
        priority: priority || 'normal',
        department_id: department_id || null,
        created_by: user.id,
        expires_at: expires_at || null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Announcement insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Announcement created successfully',
      announcement
    })
    
  } catch (error) {
    console.error('Create announcement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
