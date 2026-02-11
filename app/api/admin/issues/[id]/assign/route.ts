import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const resolvedParams = await params;
  const issueId = resolvedParams.id;

  try {
    // 1. Parse the body
    const { assignee_id, notes } = await request.json();

    // ---------------------------------------------------------
    // SCENARIO 1: UNASSIGN (assignee_id is explicitly null)
    // ---------------------------------------------------------
    if (assignee_id === null) {
      // 1. Delete the assignment record
      const { error: deleteError } = await supabase
        .from('assignments')
        .delete()
        .eq('issue_id', issueId);

      if (deleteError) throw deleteError;

      // 2. Revert issue status to 'active' (so it appears in open lists again)
      await supabase
        .from('issues')
        .update({ status: 'active' })
        .eq('id', issueId);

      return NextResponse.json({ message: "Unassigned successfully" });
    }

    // ---------------------------------------------------------
    // SCENARIO 2: ASSIGN (assignee_id is present)
    // ---------------------------------------------------------
    
    // Validation: If it's not null and not present, it's invalid
    if (!assignee_id) {
       return NextResponse.json({ error: "Assignee ID is required" }, { status: 400 });
    }

    // 1. Fetch Department ID (Required for your DB Constraint)
    const { data: issue, error: fetchError } = await supabase
      .from('issues')
      .select('department_id')
      .eq('id', issueId)
      .single();

    if (fetchError || !issue?.department_id) {
      return NextResponse.json({ error: "Could not find department for this issue" }, { status: 404 });
    }

    // 2. Perform Upsert
    const { data, error } = await supabase
      .from('assignments')
      .upsert({
        issue_id: parseInt(issueId),
        assignee_id: assignee_id,
        department_id: issue.department_id,
        notes: notes || "Assigned via Admin Dashboard",
        assigned_at: new Date().toISOString(),
      }, { onConflict: 'issue_id' })
      .select();

    if (error) throw error;

    // 3. Update Issue Status to 'under_progress'
    await supabase
      .from('issues')
      .update({ status: 'under_progress' })
      .eq('id', issueId);

    return NextResponse.json({ message: "Assignment successful", data });

  } catch (error: any) {
    console.error('Assignment API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}