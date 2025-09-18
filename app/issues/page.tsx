import { Navigation } from '@/components/navigation'
import IssuesListClient from '@/components/issues-list-client'
import { createClient } from '@/lib/supabase/server'

export default async function IssuesPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  return (
    <main className="min-h-screen flex flex-col">
      <Navigation user={user} />
      <div className="flex-1 max-w-4xl mx-auto p-6 space-y-6 w-full">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Nearby Issues</h1>
          <p className="text-muted-foreground">
            Issues reported in your area and around the community
          </p>
        </div>
        <IssuesListClient />
      </div>
    </main>
  )
}

