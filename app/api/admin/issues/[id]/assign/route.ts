import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 1. Define params as a Promise
) {
  const supabase = await createClient();
  
  // 2. Await the params object itself
  const resolvedParams = await params;
  const issueId = resolvedParams.id;
  
  try {
    const { assignee_id, notes } = await request.json();

    if (!assignee_id) {
      return NextResponse.json({ error: "Assignee ID is required" }, { status: 400 });
    }

    // 3. FETCH THE DEPARTMENT ID FROM THE ISSUE
    // This is required because your assignments table has a NOT NULL constraint on department_id
    const { data: issue, error: fetchError } = await supabase
      .from('issues')
      .select('department_id')
      .eq('id', issueId)
      .single();

    if (fetchError || !issue?.department_id) {
      return NextResponse.json({ error: "Could not find department for this issue" }, { status: 404 });
    }

    // 4. PERFORM UPSERT WITH DEPARTMENT_ID
    const { data, error } = await supabase
      .from('assignments')
      .upsert({
        issue_id: parseInt(issueId),
        assignee_id: assignee_id,
        department_id: issue.department_id, // Added to satisfy DB constraint
        notes: notes || "Assigned via Admin Dashboard",
        assigned_at: new Date().toISOString(),
      }, { onConflict: 'issue_id' })
      .select();

    if (error) throw error;

    // 5. UPDATE ISSUE STATUS
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