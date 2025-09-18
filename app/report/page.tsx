import { Navigation } from "@/components/navigation";
import { ReportForm } from "@/components/report-form";
import { createClient } from "@/lib/supabase/server";

export default async function ReportPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return (
    <main className="min-h-screen flex flex-col">
      <Navigation user={user} />
      <div className="flex-1 max-w-2xl mx-auto p-6 space-y-6 w-full">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Report an Issue</h1>
          <p className="text-muted-foreground">
            Help improve your community by reporting civic issues
          </p>
        </div>
        <ReportForm />
      </div>
    </main>
  );
}
