import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: Request) {
  const admin = createAdminClient()
  const pathname = new URL(req.url).pathname
  const idStr = pathname.split('/').slice(-2, -1)[0] || pathname.split('/').pop() || ''
  const id = Number(idStr)
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { to_status, notes, changed_by } = body as { to_status: 'active'|'under_progress'|'under_review'|'closed', notes?: string, changed_by?: string }
  if (!to_status) return NextResponse.json({ error: 'to_status is required' }, { status: 400 })

  // Fetch current status to log history correctly
  const { data: before, error: beforeErr } = await admin.from('issues').select('status').eq('id', id).single()
  if (beforeErr) return NextResponse.json({ error: beforeErr.message }, { status: 400 })

  // Update issue status
  const { error } = await admin.from('issues').update({ status: to_status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Log history
  await admin.from('status_history').insert({ issue_id: id, from_status: (before as { status: 'active'|'under_progress'|'under_review'|'closed' }).status, to_status, notes: notes ?? null, changed_by: changed_by ?? null })

  return NextResponse.json({ ok: true })
}

