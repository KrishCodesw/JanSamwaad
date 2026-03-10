import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; 
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const deltaP = p2 - p1;
  const deltaLon = lon2 - lon1;
  const deltaLambda = (deltaLon * Math.PI) / 180;

  const a =
    Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const { id } = await params;
    const numericIssueId = parseInt(id, 10);
    
   
    const body = await request.json();
    const { lat: citizenLat, lng: citizenLng, notes } = body;

    if (!citizenLat || !citizenLng) {
      return NextResponse.json({ 
        error: "Live GPS coordinates are required for the Digipin check." 
      }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Fetch the Issue details
    const { data: issue, error: fetchError } = await supabase
      .from('issues')
      .select('reporter_email, status, latitude, longitude, department_id, updated_at')
      .eq('id', numericIssueId)
      .single();

    if (fetchError || !issue) throw new Error("Issue not found");

    if (issue.status !== 'closed') {
      return NextResponse.json({ 
        error: "This issue is not currently marked as closed." 
      }, { status: 400 });
    }

    // 4. AUTHORIZATION: Verify Reporter (via Email) OR Upvoter (via votes table)
    const isReporter = 
      issue.reporter_email && 
      issue.reporter_email.toLowerCase() === user.email.toLowerCase();
      
    let isUpvoter = false;

    if (!isReporter) {
      const { data: voteData } = await supabase
        .from('votes')
        .select('id')
        .eq('issue_id', numericIssueId)
        .eq('voter_id', user.id)
        .single();
        
      if (voteData) isUpvoter = true;
    }

    if (!isReporter && !isUpvoter) {
      return NextResponse.json({ 
        error: "Only the original reporter or citizens who upvoted this issue can submit an appeal." 
      }, { status: 403 });
    }


    const closedDate = new Date(issue.updated_at);
    const now = new Date();
    const daysSinceClosed = (now.getTime() - closedDate.getTime()) / (1000 * 3600 * 24);
    
    if (daysSinceClosed > 7) {
      return NextResponse.json({ 
        error: "The 7-day verification window has expired." 
      }, { status: 403 });
    }

   
    const distance = getDistanceInMeters(citizenLat, citizenLng, issue.latitude, issue.longitude);
    if (distance > 50) {
      return NextResponse.json({ 
        error: `Location verification failed. You are ${Math.round(distance)} meters away. You must be within 50 meters to appeal.` 
      }, { status: 403 });
    }

   
    const { count: appealCount, error: countError } = await supabase
      .from('status_history')
      .select('*', { count: 'exact', head: true })
      .eq('issue_id', numericIssueId)
      .eq('from_status', 'closed')
      .eq('to_status', 'under_review');

    if (countError) throw countError;

   
    const targetStatus = 'under_review';

    let auditNote = notes || "Citizen reported the issue needs more work.";

    if (appealCount === 0) {
     
      const { error: updateError } = await supabase
        .from('issues')
        .update({ status: targetStatus, updated_at: new Date().toISOString() })
        .eq('id', numericIssueId);
        
      if (updateError) throw updateError;

    } else {
    
      auditNote = `[ESCALATED] Citizen appealed a second time. Reason: ${notes}`;

      await supabase
        .from('issues')
        .update({ status: targetStatus, updated_at: new Date().toISOString() })
        .eq('id', numericIssueId);
      
     
      const { data: adminData } = await supabase
        .from('profiles')
        .select('id')
        .eq('department_id', issue.department_id)
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (adminData) {
      
        await supabase
          .from('assignments')
          .update({ assignee_id: adminData.id })
          .eq('issue_id', numericIssueId);
      } else {
        console.warn(`No admin found for department ${issue.department_id} to escalate issue ${numericIssueId}`);
      }
    }


    const { error: auditError } = await supabase
      .from('status_history')
      .insert({
        issue_id: numericIssueId,
        from_status: 'closed',
        to_status: targetStatus,
        changed_by: user.id,
        notes: auditNote
      });

    if (auditError) console.error("Audit log failed:", auditError);

    return NextResponse.json({ 
      success: true, 
      message: appealCount === 0 
        ? "Issue returned to the official for rework." 
        : "Issue escalated to Department Admin." 
    });

  } catch (error: any) {
    console.error("Appeal API Error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to process the appeal." 
    }, { status: 500 });
  }
}