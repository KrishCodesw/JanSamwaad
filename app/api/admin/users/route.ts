import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Define the shape of our data
type UserProfile = {
  id: string;
  display_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
  region: string | null;
  department: { id: number; name: string } | null;
  reported_issues: { count: number }[];
  assigned_tasks: { count: number }[];
  votes: { count: number }[];
};

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const role = searchParams.get('role');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    let query = supabase
      .from('profiles')
      .select(`
        *,
        department:departments!profiles_department_id_fkey(id, name),
        reported_issues:issues(count),
        assigned_tasks:assignments!assignments_assignee_id_fkey(count),
        votes:votes(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.ilike('display_name', `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Users fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Cast data to our type
    const profiles = data as unknown as UserProfile[];

    const enrichedUsers = profiles?.map((profile) => {
      const reports = profile.reported_issues?.[0]?.count || 0;
      const workload = profile.assigned_tasks?.[0]?.count || 0;
      
      let statusLabel = "Active";
      let statusColor = "green";

      if (profile.role === 'official') {
        if (workload === 0) {
          statusLabel = "Idle";
          statusColor = "gray";
        } else if (workload > 10) {
          statusLabel = "Overloaded";
          statusColor = "red";
        } else {
          statusLabel = "Healthy";
          statusColor = "green";
        }
      } else if (profile.role === 'citizen') {
        if (reports > 20) {
          statusLabel = "Super Citizen";
          statusColor = "purple";
        }
      }

      return {
        id: profile.id,
        display_name: profile.display_name,
        email: profile.email,
        role: profile.role,
        department: profile.department ? profile.department.name : "N/A",
        region: profile.region || "N/A",
        joined_at: profile.created_at,
        reports_count: reports,
        workload_count: workload,
        votes_count: profile.votes?.[0]?.count || 0,
        status_label: statusLabel,
        status_color: statusColor
      };
    });

    return NextResponse.json({
      users: enrichedUsers || [],
      total: count || 0,
      page: Math.floor(offset / limit) + 1
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}