import { NextResponse } from "next/server";
import { NextRequest } from "next/server"; // ✅ keep this for Next.js API routes
import { createClient } from "@/lib/supabase/server";

// ✅ Changed Request -> NextRequest
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  try {
    // Check if user is admin/official
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

    // ✅ request.json() -> req.json()
    const body = await req.json();
    const { category } = body;

    if (!category || typeof category !== "string") {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const { error: insertError } = await supabase
      .from("department_categories")
      .insert({ department_id: params.id, category });

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

// ✅ Changed Request -> NextRequest
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  try {
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

    // ✅ request.url -> req.url
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from("department_categories")
      .delete()
      .eq("department_id", params.id)
      .eq("category", category);

    if (deleteError) {
      console.error("Category delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove category" },
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

// ✅ Already correct
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  try {
    const { data: categories, error } = await supabase
      .from("department_categories")
      .select("category")
      .eq("department_id", params.id)
      .order("category");

    if (error) {
      console.error("Categories fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }

    return NextResponse.json(categories.map((c) => c.category));
  } catch (error) {
    console.error("Department categories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
