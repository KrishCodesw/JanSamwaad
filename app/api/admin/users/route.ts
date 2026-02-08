// /app/api/admin/users/route.ts - GET Handler

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient() 
  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const { data: { user } } = await supabase.auth.getUser()
    // ... (Keep your admin check logic here)

    let query = supabase
      .from('profiles')
      .select(`
        *,
        issues:issues(count),
        votes:votes(count),
        announcements:announcements(count)
      `, { count: 'exact' }) // Added exact count here
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    const { data: profiles, error: usersError, count } = await query

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Format counts so frontend gets a number, not an object like { count: 5 }
    const formattedUsers = profiles?.map(profile => ({
      ...profile,
      issues_count: profile.issues?.[0]?.count || 0,
      votes_count: profile.votes?.[0]?.count || 0,
      announcements_count: profile.announcements?.[0]?.count || 0
    }))

    return NextResponse.json({
      users: formattedUsers || [],
      total: count || 0,
      offset,
      limit
    })
    
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}