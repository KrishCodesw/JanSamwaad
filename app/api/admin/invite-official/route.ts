// app/api/admin/invite-official/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1. Check if requester is an ADMIN
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Verify the requester's role in the DB
  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  if (requesterProfile?.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { email, department_id, name } = await req.json();

  // 2. Use Supabase Admin API to Invite User
  // This sends an email to the official with a "Set Password" link
  const { data: newUser, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { 
      display_name: name,
      role: 'official', // <--- We forcefully set the role here!
      department_id: department_id
    }
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // 3. Create the Profile Entry immediately
  await supabase.from('profiles').insert({
    id: newUser.user.id,
    email: email,
    display_name: name,
    role: 'official', // <--- Stored securely in DB
    department_id: department_id
  });

  return NextResponse.json({ message: "Invitation sent!" });
}