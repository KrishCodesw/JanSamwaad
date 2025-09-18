import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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

    // Get admin statistics
    const { data: stats, error: statsError } = await supabase.rpc('get_admin_stats')
    
    if (statsError) {
      console.error('Stats error:', statsError)
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
    }

    return NextResponse.json(stats)
    
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
