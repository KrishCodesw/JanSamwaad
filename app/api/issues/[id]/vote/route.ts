import { createClient as createUserClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(
  request: Request, 
  { params }: { params: Promise<{ id: string }> } 
) {
  const { id } = await params;
  const numericIssueId = parseInt(id, 10);

  const userClient = await createUserClient(); 
  const { data: { user } } = await userClient.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    // THE FIX: Catch the specific PostgreSQL duplicate key error
    if (error.code === '23505') {
      return NextResponse.json({ error: "Already voted" }, { status: 409 }); // 409 = Conflict
    }
    
    console.error("Vote Insert Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}