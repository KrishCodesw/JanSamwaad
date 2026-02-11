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

  // 1. SELECT issues(status) instead of count, so we can filter in JS
  let query = supabase
    .from("profiles")
    .select(`*, issues(status)`) 
    .eq("department_id", departmentId)
    .eq("role", "official");

  // 2. Apply Region Filter (Only if valid)
  if (region && region !== "All" && region !== "Location Missing") {
    query = query.ilike("region", `%${region}%`);
  }

  const { data: officials, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 3. Process the data in JS
  const formatted = officials.map((off) => {
    // Count only non-closed issues manually
    // This ensures officials with 0 issues still appear in the list!
    const activeWorkload = off.issues?.filter((i: any) => i.status !== 'closed').length || 0;

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