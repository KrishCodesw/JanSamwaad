import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Check if requester is Admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Use Admin Client to write to protected columns
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const resolvedParams = await params;
  const userId = resolvedParams.id;
  const { role, region, department_id } = await request.json();

  try {
    const { error } = await adminSupabase
      .from('profiles')
      .update({
        role,
        region: role === 'official' ? region : null, // Clear region if not official
        department_id: role === 'official' ? department_id : null // Clear dept if not official
      })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ message: "User updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}