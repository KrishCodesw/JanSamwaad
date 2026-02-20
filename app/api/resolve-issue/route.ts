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
    const proofFile = formData.get("proof") as File | null;

    if (!issueId || !proofFile) {
      return NextResponse.json(
        { error: "Missing required fields: issue_id or proof image." }, 
        { status: 400 }
      );
    }

    // 3. Upload the image to Supabase Storage
    // Generate a unique file name to prevent collisions
    const fileExt = proofFile.name.split('.').pop();
    const fileName = `issue-${issueId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("proofs") // Ensure this bucket is created and public in your Supabase dashboard
      .upload(fileName, proofFile, {
        contentType: proofFile.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload proof image to storage." }, 
        { status: 500 }
      );
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

    if (issueFetchError || !currentIssue) {
      console.error("Error fetching current issue:", issueFetchError);
      return NextResponse.json({ error: "Issue not found in database." }, { status: 404 });
    }

    const fromStatus = currentIssue.status;
    const toStatus = "closed";

    // 6. Database Updates 
    // Step A: Insert into the new proof_of_work table
    const { error: proofError } = await supabase
      .from("proof_of_work")
      .insert({
        issue_id: parseInt(issueId),
        official_id: user.id,
        image_url: publicUrl,
        notes: note || null,
      });

    if (proofError) {
      console.error("Proof insertion failed:", proofError);
      return NextResponse.json({ error: "Failed to save proof of work record." }, { status: 500 });
    }

    // Step B: Update the issue status to closed
    const { error: issueUpdateError } = await supabase
      .from("issues")
      .update({ 
        status: toStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", issueId);

    if (issueUpdateError) {
      console.error("Issue update failed:", issueUpdateError);
      return NextResponse.json({ error: "Failed to update issue status." }, { status: 500 });
    }

    // Step C: Log the status change in status_history
    const { error: historyError } = await supabase
      .from("status_history")
      .insert({
        issue_id: parseInt(issueId),
        from_status: fromStatus,
        to_status: toStatus,
        notes: note ? `Resolution applied: ${note}` : "Issue resolved by official.",
        changed_by: user.id,
      });

    if (historyError) {
      console.error("Status history update failed:", historyError);
      return NextResponse.json({ error: "Failed to log status history." }, { status: 500 });
    }

    // 7. Return success to the frontend
    return NextResponse.json({ 
      success: true, 
      message: "Issue resolved successfully",
      imageUrl: publicUrl 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Critical resolution error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error occurred during resolution." },
      { status: 500 }
    );
  }
}