"use client"

import { useEffect, useState } from 'react'

type Issue = { id: number; status: string; description: string }
export default function AdminIssuesClient() {
  const [issues, setIssues] = useState<Issue[]>([])
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/issues', { cache: 'no-store' })
      const data = await res.json()
      setIssues(data || [])
    })()
  }, [])

  return (
    <div className="grid gap-2">
      {issues.map((it) => (
        <div key={it.id} className="p-3 rounded border text-sm">
          <a className="underline" href={`/issues/${it.id}`}>#{it.id}</a> {it.status} · {it.description}
        </div>
      ))}
      {!issues.length && <div className="text-sm text-muted-foreground">No issues</div>}
    </div>
  )
}

