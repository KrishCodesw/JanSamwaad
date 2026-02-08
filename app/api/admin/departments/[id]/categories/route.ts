import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// This POST handler adds a new category to a department.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) { 
  const supabase = await createClient();
  const { id } = await params; // Await the params

  try {
    // Check if user is admin or official.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !profile ||
      !["admin", "official"].includes(profile.role)
    ) {
      return NextResponse.json(
        {
          error: "Access denied - Admin/Official access required",
          debug: {
            userId: user.id,
            userEmail: user.email,
            profileFound: !!profile,
            currentRole: profile?.role,
            allowedRoles: ["admin", "official"],
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { category } = body;

    if (!category || typeof category !== "string") {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Insert the new category into the database.
    const { error: insertError } = await supabase
      .from("department_categories")
      .insert({ department_id: parseInt(id), category }); // Use awaited id

    if (insertError) {
      console.error("Category insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to add category" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Department categories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// This DELETE handler removes a category from a department.
// /app/api/admin/departments/[id]/categories/route.ts

// ... (POST handler is fine as you updated it)

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  const deptId = parseInt(id); // <--- Cast here

  try {
    // ... (Keep auth/role checks)

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    if (!category) return NextResponse.json({ error: "Category is required" }, { status: 400 });

    const { error: deleteError } = await supabase
      .from("department_categories")
      .delete()
      .eq("department_id", deptId) // <--- Use deptId
      .eq("category", category);

    if (deleteError) throw deleteError;
    return NextResponse.json({ success: true });
  } catch (error) { /* ... */ }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  const deptId = parseInt(id); // <--- Cast here

  try {
    const { data: categories, error } = await supabase
      .from("department_categories")
      .select("category")
      .eq("department_id", deptId) // <--- Use deptId
      .order("category");

    if (error) throw error;
    return NextResponse.json(categories.map((c) => c.category));
  } catch (error) { /* ... */ }
}