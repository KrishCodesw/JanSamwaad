import { createClient as createUserClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(
  request: Request, 
  { params }: { params: Promise<{ id: string }> } 
) {
  const { id } = await params;
  
  // 1. Fix the type mismatch! Convert string to number
  const numericIssueId = parseInt(id, 10);

  // 2. Verify the user using the standard auth client
  const userClient = await createUserClient(); 
  const { data: { user } } = await userClient.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Use an Admin Client to insert the vote to bypass RLS blocks
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminClient
    .from('votes')
    .insert({
      issue_id: numericIssueId, 
      voter_id: user.id
    });

  if (error) {
    console.error("Vote Insert Error:", error);
    // If the user already voted, Postgres might throw a unique constraint error here.
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}