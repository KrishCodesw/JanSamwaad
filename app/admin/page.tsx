import { redirect } from 'next/navigation'

// Redirect /admin to /admin/issues for now
export default function AdminPage() {
  redirect('/admin/issues')
}
