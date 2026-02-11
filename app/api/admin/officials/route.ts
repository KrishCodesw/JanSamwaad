// app/api/admin/officials/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId");
  const region = searchParams.get("region");

  if (!departmentId) {
    return NextResponse.json({ error: "Dept ID required" }, { status: 400 });
  }

  // 1. UPDATE QUERY: Select 'assignments' instead of 'issues'
  // We use !assignee_id to explicitly tell Supabase to use the foreign key for assignments
  let query = supabase
    .from("profiles")
    .select(`
      *,
      assignments!assignee_id (
        issue:issues (
          status
        )
      )
    `)
    .eq("department_id", departmentId)
    .eq("role", "official");

  // 2. Apply Region Filter (Only if valid)
  if (region && region !== "All" && region !== "Location Missing") {
    query = query.ilike("region", `%${region}%`);
  }

  const { data: officials, error } = await query;

  if (error) {
    console.error("Error fetching officials:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3. Process the data to calculate workload correctly
  const formatted = officials.map((off: any) => {
    // Access the assignments array (it might be empty if no assignments)
    const myAssignments = off.assignments || [];

    // Filter to count only ACTIVE issues
    // We check if the assignment has a connected issue, and that issue is NOT closed
    const activeWorkload = myAssignments.filter((assignment: any) => {
      return assignment.issue && assignment.issue.status !== 'closed';
    }).length;

    return {
      id: off.id,
      name: off.display_name,
      region: off.region || "General",
      workload: activeWorkload,
    };
  });

  // Sort: Least busy officials first
  formatted.sort((a, b) => a.workload - b.workload);

  return NextResponse.json(formatted);
}