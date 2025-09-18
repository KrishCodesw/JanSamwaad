import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminDashboard from '@/components/admin-dashboard'

export default async function AdminPage() {
  const supabase = await createClient()
  
  // Check authentication and role
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/login')
  }
  
  // Check if user has admin/official role based on email
  const isGovernmentEmail = user.email?.endsWith('@nic.in') || user.email?.endsWith('@gov.in') || user.email?.includes('admin')
  
  if (!isGovernmentEmail) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            This admin portal is restricted to government officials only.
          </p>
          <p className="text-sm text-gray-500">
            Only users with @nic.in, @gov.in email domains have access to administrative functions.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Current user: {user.email}
          </p>
        </div>
      </main>
    )
  }
  
  return (
    <main className="max-w-7xl mx-auto p-6">
      <AdminDashboard />
    </main>
  )
}

