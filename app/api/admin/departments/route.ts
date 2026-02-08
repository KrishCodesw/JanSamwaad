// /app/api/admin/departments/route.ts
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
// /app/api/admin/departments/route.ts

export async function GET() {
  const supabase = await createClient()
  
  try {
    const { data: departments, error } = await supabase
      .from('departments')
      .select(`
        id,
        name,
        description,
        creator:profiles!departments_created_by_fkey ( display_name ),
        officials_count:profiles(count),
        assignments_count:assignments(count),
        issues_count:issues(count)
      `)
      .order('name')

    if (error) throw error;

    const formattedDepartments = departments?.map(dept => ({
      ...dept,
      created_by_name: dept.creator?.[0]?.display_name || 'System',
      officials_count: dept.officials_count?.[0]?.count || 0,
      assignments_count: dept.assignments_count?.[0]?.count || 0,
      issues_count: dept.issues_count?.[0]?.count || 0,
      regions_count: 0 // Placeholder
    }))

    return NextResponse.json(formattedDepartments || [])
    
  } catch (error) {
    console.error('Departments GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}