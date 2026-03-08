import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request, 
  { params }: { params: Promise<{ id: string }> } // 1. Update the type to Promise
) {
  // 2. Await the params before trying to use the ID!
  const { id } = await params;

  const supabase = await createClient(); 
  
  // Get the logged-in user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ONLY DO THIS: Insert the vote record.
  const { error } = await supabase
    .from('votes')
    .insert({
      issue_id: id, // 3. Use the awaited 'id' variable here
      voter_id: user.id
    });

  if (error) {
    console.error("Vote Insert Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}