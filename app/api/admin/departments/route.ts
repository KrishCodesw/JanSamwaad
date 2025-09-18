import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Correctly fetches all departments AND the name of the user who created them
export async function GET() {
  const supabase = await createClient()
  
  try {
    const { data: departments, error } = await supabase
      .from('departments')
      .select(`
        id,
        name,
        description,
        profiles:profiles!departments_created_by_fkey ( displayname ) 
      `)
      .order('name')

    if (error) {
      console.error('Departments fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
    }

    return NextResponse.json(departments || [])
    
  } catch (error) {
    console.error('Departments GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Correctly creates a new department and assigns the current user as the creator
export async function POST(request: Request) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // You can add your role check logic back in here if needed

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 })
    }

    const { data: department, error: insertError } = await supabase
      .from('departments')
      .insert({
        name,
        description: description || null,
        created_by: user.id // This is the main fix
      })
      .select()
      .single()

    if (insertError) {
      console.error('Department insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create department' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Department created successfully',
      department
    })
    
  } catch (error) {
    console.error('Department POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}