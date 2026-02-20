import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Get the currently authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch issues where this specific user is the assignee
    // We use an !inner join on the assignments table to filter the issues
    const { data: issues, error: fetchError } = await supabase
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
      .neq("status", "closed") // Optional: hide closed issues from the pending dashboard
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Supabase error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch assigned issues" },
        { status: 500 }
      );
    }

    // 3. Return the data to the frontend
    return NextResponse.json({ data: issues });

  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}