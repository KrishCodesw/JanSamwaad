import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId");

  if (!departmentId) {
    return NextResponse.json({ error: "Department ID required" }, { status: 400 });
  }

  // Fetch officials for this department with their active issue count
  const { data: officials, error } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      region,
      role,
      active_issues: issues(count)
    `)
    .eq("department_id", departmentId)
    .eq("role", "official")
    .neq("issues.status", "closed") // Only count non-closed issues
    .neq("issues.status", "resolved");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Format the data for the UI
  const formatted = officials.map((off) => ({
    id: off.id,
    name: off.display_name,
    region: off.region || "General",
    workload: off.active_issues?.[0]?.count || 0,
  }));

  // Sort by workload (lowest first) to encourage load balancing
  formatted.sort((a, b) => a.workload - b.workload);

  return NextResponse.json(formatted);
}