// app/api/admin/officials/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId");
  const region = searchParams.get("region"); // <--- GET REGION PARAM

  if (!departmentId) {
    return NextResponse.json({ error: "Dept ID required" }, { status: 400 });
  }

  let query = supabase
    .from("profiles")
    .select(`*, active_issues: issues(count)`)
    .eq("department_id", departmentId)
    .eq("role", "official")
    .neq("issues.status", "closed");

  // ONLY filter by region if a specific region is requested
  // and we are not in a "fallback" mode
  if (region && region !== "All") {
    query = query.ilike("region", `%${region}%`); // Loose match (e.g. "Andheri" matches "Andheri East")
  }

  const { data: officials, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const formatted = officials.map((off) => ({
    id: off.id,
    name: off.display_name,
    region: off.region || "General",
    workload: off.active_issues?.[0]?.count || 0,
  }));

  // Sort by workload (Least loaded first)
  formatted.sort((a, b) => a.workload - b.workload);

  return NextResponse.json(formatted);
}