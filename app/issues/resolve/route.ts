import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate the official
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse the multipart/form-data request
    const formData = await request.formData();
    const issueId = formData.get("issue_id") as string;
    const note = formData.get("note") as string;
    const proofFile = formData.get("proof") as File;

    if (!issueId || !proofFile) {
      return NextResponse.json(
        { error: "Missing required fields (issue_id or proof image)" }, 
        { status: 400 }
      );
    }

    // 3. Upload the image to Supabase Storage
    // Generate a unique file name to prevent collisions
    const fileExt = proofFile.name.split('.').pop();
    const fileName = `issue-${issueId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("proofs") // This bucket needs to be created in your Supabase dashboard
      .upload(fileName, proofFile, {
        contentType: proofFile.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload proof image" }, { status: 500 });
    }

    // 4. Retrieve the public URL of the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from("proofs")
      .getPublicUrl(fileName);

    // 5. Fetch the current status of the issue to track the transition
    const { data: currentIssue, error: issueFetchError } = await supabase
      .from("issues")
      .select("status")
      .eq("id", issueId)
      .single();

    if (issueFetchError) {
      console.error("Error fetching current issue:", issueFetchError);
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const fromStatus = currentIssue.status;
    const toStatus = "closed";

    // 6. Database Updates 
    // Step A: Insert into proof_of_work table
    const { error: proofError } = await supabase
      .from("proof_of_work")
      .insert({
        issue_id: parseInt(issueId),
        official_id: user.id,
        image_url: publicUrl,
        notes: note || null,
      });

    if (proofError) throw new Error(`Proof insertion failed: ${proofError.message}`);

    // Step B: Update the issue status
    const { error: issueUpdateError } = await supabase
      .from("issues")
      .update({ 
        status: toStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", issueId);

    if (issueUpdateError) throw new Error(`Issue update failed: ${issueUpdateError.message}`);

    // Step C: Log the status change in status_history
    const { error: historyError } = await supabase
      .from("status_history")
      .insert({
        issue_id: parseInt(issueId),
        from_status: fromStatus,
        to_status: toStatus,
        notes: `Resolution applied: ${note}`,
        changed_by: user.id,
      });

    if (historyError) throw new Error(`Status history update failed: ${historyError.message}`);

    // 7. Return success
    return NextResponse.json({ 
      success: true, 
      message: "Issue resolved successfully",
      imageUrl: publicUrl 
    });

  } catch (error: any) {
    console.error("Resolution error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}