import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    const { notes } = body;

    // 1. Authenticate the citizen
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    
    const { error: updateError } = await supabase
      .from("issues")
      .update({ 
        status: "under_review",
        updated_at: new Date().toISOString() 
      })
      .eq("id", parseInt(id));

    if (updateError) {
      console.error("Failed to update issue status:", updateError);
      throw new Error("Failed to update issue status");
    }

    // 3. LOG THE HISTORY
    const { error: historyError } = await supabase
      .from("status_history")
      .insert({
        issue_id: parseInt(id),
        from_status: "closed",
        to_status: "under_review",
        notes: notes || "Citizen rejected the repair.",
        changed_by: user.id
      });

    if (historyError) {
      console.error("Failed to log history:", historyError);
      throw new Error("Failed to log history");
    }

    return NextResponse.json({ success: true, message: "Issue appealed successfully." });

  } catch (error: any) {
    console.error("Appeal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}