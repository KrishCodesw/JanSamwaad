// /app/api/admin/departments/route.ts
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
export async function GET() {
  const supabase = await createClient()
  
  try {
    const { data: departments, error } = await supabase
      .from('departments')
      .select(`
        id,
        name,
        description,
        creator:profiles!departments_created_by_fkey ( 
          display_name 
        ) 
      `)
      .order('name')

    if (error) {
      console.error('Departments fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
    }

    // Flatten the creator name for the frontend if needed
    const formattedDepartments = departments?.map(dept => ({
      ...dept,
      created_by_name: dept.creator?.[0]?.display_name || 'System'
    }))

    return NextResponse.json(formattedDepartments || [])
    
  } catch (error) {
    console.error('Departments GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}