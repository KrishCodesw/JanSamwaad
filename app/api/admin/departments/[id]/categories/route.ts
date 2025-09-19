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
      .insert({ department_id: id, category }); // Use awaited id

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
export async function DELETE(
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

    // Get the category to delete from the URL search parameters.
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    // Delete the category from the database.
    const { error: deleteError } = await supabase
      .from("department_categories")
      .delete()
      .eq("department_id", id) // Use awaited id
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

// This GET handler retrieves all categories for a given department.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params; // Await the params

  try {
    // Fetch categories for the department.
    const { data: categories, error } = await supabase
      .from("department_categories")
      .select("category")
      .eq("department_id", id) // Use awaited id
      .order("category");

    if (error) {
      console.error("Categories fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }

    // Return the categories as an array of strings.
    return NextResponse.json(categories.map((c) => c.category));
  } catch (error) {
    console.error("Department categories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}