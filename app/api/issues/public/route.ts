import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  // Use the standard server client, which can act as 'anon'
  const supabase = await createClient() 
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '100')

  try {
    // !! NO AUTH CHECKS HERE !!
    // This is a public route.

    let query = supabase
      .from('issues')
      .select(`
        *,
        images:issue_images(url),
        vote_count:votes(count),
        assignment:assignments(
          department:departments(name),
          assigned_at,
          notes
        )
      `)
      .order('flagged', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data: issues, error } = await query

    if (error) {
      console.error('Public issues fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 })
    }

    return NextResponse.json(issues || [])
    
  } catch (error) {
    console.error('Public issues error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}