import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    // Extract query parameters from the request URL
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "pending"; 

    const supabase = await createClient();
    
    // 1. Get the currently authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Build the base query
    let query = supabase
      .from("issues")
      .select(`
        *,
        assignments!inner(*),
        images:issue_images(url),
        status_changes:status_history(
          from_status,
          to_status,
          changed_at,
          notes,
          changed_by,
          profiles(display_name)
        )
      `)
      .eq("assignments.assignee_id", user.id)
      .order("created_at", { ascending: false });

    // 3. Apply status filter dynamically based on the query param
    // Assuming "closed" is the string your database uses for resolved issues
    if (statusFilter === "resolved") {
      query = query.eq("status", "closed"); 
    } else {
      query = query.neq("status", "closed"); 
    }

    const { data: issues, error: fetchError } = await query;

    if (fetchError) {
      console.error("Supabase error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch assigned issues" },
        { status: 500 }
      );
    }

    // 4. Return the data to the frontend
    return NextResponse.json({ data: issues });

  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}