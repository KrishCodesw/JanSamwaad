import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
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
      .order('name');

    if (error) throw error;

    const formatted = departments?.map(dept => ({
      ...dept,
      created_by_name: dept.creator?.[0]?.display_name || 'System',
      officials_count: dept.officials?.[0]?.count || 0,
      assignments_count: dept.assignments?.[0]?.count || 0,
      issues_count: dept.issues?.[0]?.count || 0,
      regions_count: 0
    }));

    return NextResponse.json(formatted || []);
  } catch (error) {
    console.error('Departments GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add this POST handler to create new departments
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !["admin", "official"].includes(profile.role)) {
       return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("departments")
      .insert({ 
        name, 
        description,
        created_by: user.id 
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Department creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}