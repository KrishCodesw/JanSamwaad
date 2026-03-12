import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

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

    // Initialize Admin Client to bypass RLS
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: issue, error: fetchError } = await supabase
      .from("issues")
      .select("status, updated_at")
      .eq("id", parseInt(id))
      .single();

    if (fetchError || !issue) {
      return NextResponse.json({ error: "Issue not found." }, { status: 404 });
    }

    if (issue.status !== "closed") {
      return NextResponse.json({ error: "Only closed issues can be appealed." }, { status: 400 });
    }
    
    const updatedDate = new Date(issue.updated_at || new Date()).getTime();
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    if (updatedDate < sevenDaysAgo) {
      return NextResponse.json(
        { error: "The 7-day verification window has expired. This issue is permanently closed." }, 
        { status: 403 }
      );
    }
    // ------------------------------------------------

    // 2. UPDATE THE MAIN ISSUE TABLE (Using supabaseAdmin!)
    const { error: updateError } = await supabaseAdmin
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

    // 3. LOG THE HISTORY (Using supabaseAdmin!)
    const { error: historyError } = await supabaseAdmin
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