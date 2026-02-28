import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Optional but highly recommended: Cache this specific route for 30-60 seconds 
// so the database isn't hit every time someone moves the map.
export const revalidate = 60; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  // Maps can usually handle more data when it's lightweight, so you can bump the limit if you want
  const limit = parseInt(searchParams.get('limit') || '200') 
  const statusFilter = searchParams.get('status')
  
  const supabase = await createClient()
  
  try {
    // STRICTLY select only the columns the Leaflet map uses. 
    // NO images, NO status_history, NO departments.
    let query = supabase
      .from('issues')
      .select(`
        id,
        status,
        description,
        latitude,
        longitude,
        flagged,
        created_at,
        tags,
        votes(count)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }
    
    const { data: issues, error } = await query
    
    if (error) {
      console.error('Map API error:', error)
      return NextResponse.json({ error: 'Failed to fetch map issues' }, { status: 500 })
    }
    
    // Process vote counts exactly like the main API
    const mapData = (issues || []).map(issue => ({
      ...issue,
      // Delete the votes array after extracting the count so the JSON stays tiny
      vote_count: issue.votes?.[0]?.count || 0,
      votes: undefined 
    }))
    
    return NextResponse.json(mapData)
  } catch (error) {
    console.error('Map API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}