// /app/api/admin/departments/route.ts
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
// /app/api/admin/departments/route.ts

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
        officials:profiles!profiles_department_id_fkey(count),
        assignments:assignments(count),
        issues:issues(count)
      `)
      .order('name')

    if (error) throw error;

    const formatted = departments?.map(dept => ({
      ...dept,
      created_by_name: dept.creator?.[0]?.display_name || 'System',
      officials_count: dept.officials?.[0]?.count || 0,
      assignments_count: dept.assignments?.[0]?.count || 0,
      issues_count: dept.issues?.[0]?.count || 0,
      regions_count: 0
    }))

    return NextResponse.json(formatted || [])
  } catch (error) {
    console.error('Departments GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}