import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericIssueId = parseInt(id, 10);
    
    const body = await request.json();
    const { notes } = body;

    if (!notes) {
      return NextResponse.json({ error: "Roadblock reason is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 
    const { data: assignment } = await supabase
      .from('assignments')
      .select('department_id, assignee_id')
      .eq('issue_id', numericIssueId)
      .single();

    if (!assignment) {
      return NextResponse.json({ error: "Issue is not assigned." }, { status: 400 });
    }

  
    if (assignment.assignee_id !== user.id) {
      return NextResponse.json({ error: "Only the assigned official can escalate this issue." }, { status: 403 });
    }

    // 2. Find the Admin for this department
    const { data: adminData } = await supabase
      .from('profiles')
      .select('id')
      .eq('department_id', assignment.department_id)
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: "No Department Admin found to escalate to." }, { status: 404 });
    }

    // 3. Swap the assignment to the Admin
    await supabase
      .from('assignments')
      .update({ assignee_id: adminData.id })
      .eq('issue_id', numericIssueId);

    // 4. Change status to under_review
    await supabase
      .from('issues')
      .update({ status: 'under_review', updated_at: new Date().toISOString() })
      .eq('id', numericIssueId);

    // 5. Log the roadblock in status_history
    await supabase
      .from('status_history')
      .insert({
        issue_id: numericIssueId,
        from_status: 'under_progress',
        to_status: 'under_review',
        changed_by: user.id,
        notes: `[ROADBLOCK ESCALATION]: ${notes}`
      });

    return NextResponse.json({ success: true, message: "Issue escalated to admin successfully." });

  } catch (error: any) {
    console.error("Roadblock API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process roadblock." }, { status: 500 });
  }
}