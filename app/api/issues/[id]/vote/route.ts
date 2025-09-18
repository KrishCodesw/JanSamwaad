import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'node:crypto'

export async function POST(req: Request) {
  const admin = createAdminClient()
  const pathname = new URL(req.url).pathname
  const idStr = pathname.split('/').slice(-2, -1)[0] || pathname.split('/').pop() || ''
  const id = Number(idStr)
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  // For anonymous upvotes, dedupe by IP+UA hash
  const ip = req.headers.get('x-forwarded-for') || '0.0.0.0'
  const ua = req.headers.get('user-agent') || ''
  const voter_ip_hash = crypto.createHash('sha256').update(`${ip}|${ua}`).digest('hex')

  type VoteBody = { voter_id?: string }
  const body: VoteBody = await req.json().catch(() => ({} as VoteBody))
  const voter_id = body.voter_id

  const { error } = await admin.from('votes').insert({ issue_id: id, voter_id: voter_id ?? null, voter_ip_hash })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

