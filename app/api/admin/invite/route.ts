import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// ⚠️ We use the SERVICE ROLE key to bypass RLS and access Admin Auth APIs
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, fullName, departmentId, region } = body;

    // 1. Create the User via Admin API
    // This sends an email to the user with a link to set their password.
    const { data: userData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        display_name: fullName,
        role: 'official', // Stored in Auth Metadata (Optional)
      }
    });

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    const newUserId = userData.user.id;

    // 2. Create the Profile Entry with OFFICIAL Role
    // This is the source of truth for your app's permissions.
 // ... inside the insert block ...
// 2. Create OR Update the Profile Entry (Upsert)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({  // <--- CHANGED FROM 'insert' TO 'upsert'
        id: newUserId,
        // email: email,
        display_name: fullName,
        role: 'official',
        department_id: departmentId,
        region: region,
        // We typically don't update 'created_at' on upsert, but for simplicity this is fine
        // or you can remove created_at if you want to keep the original date
      });

    if (profileError) {
      // Cleanup: If profile creation fails, delete the auth user so we don't have orphans
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Invitation sent successfully!" });

  } catch (error: any) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}