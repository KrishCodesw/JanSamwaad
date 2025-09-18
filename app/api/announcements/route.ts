import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  try {
    // Get active announcements for citizens
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select(`
        id,
        title,
        content,
        type,
        priority,
        created_at,
        expires_at,
        department:departments(name)
      `)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10) // Limit to recent 10 announcements

    if (error) {
      console.error('Public announcements fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
    }

    return NextResponse.json(announcements || [])
    
  } catch (error) {
    console.error('Public announcements error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
