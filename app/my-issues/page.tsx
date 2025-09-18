import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navigation } from '@/components/navigation'
import MyIssuesClient from '@/components/my-issues-client'

export default async function MyIssuesPage() {
  const supabase = await createClient()
  
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims
  
  if (!user) {
    redirect('/auth/login')
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navigation user={user} />
      <div className="flex-1 max-w-4xl mx-auto p-6 space-y-6 w-full">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">My Issues</h1>
          <p className="text-muted-foreground">
            Track the status of issues you've reported
          </p>
        </div>
        <MyIssuesClient />
      </div>
    </main>
  )
}
