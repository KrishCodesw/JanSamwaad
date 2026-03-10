import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

import OfficialDashboard from "@/components/official-dashboard";

export default async function OfficialDashboardPage() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user || !user.sub) {
    redirect("/auth/login");
  }

  // 1. Fetch the user's role from your profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.sub)
    .single();

  // 2. Check the role from the profile, not the claims
  if (profile?.role !== "admin" && profile?.role !== "official") {
    redirect("/");
  }

  const isOfficial = profile?.role === "official" || profile?.role === "admin";

  return (
    <main className="min-h-screen flex flex-col">
      <Navigation user={user} isOfficial={isOfficial} />
      <div className="flex-1 max-w-4xl mx-auto p-6 space-y-6 w-full">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Official Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and resolve reported civic issues
          </p>
        </div>
        <OfficialDashboard />
      </div>
      <Footer />
    </main>
  );
}
