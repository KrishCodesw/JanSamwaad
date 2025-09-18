"use client"

import { useState } from 'react'

export default function ClientUpvote({ id }: { id: number }) {
  const [done, setDone] = useState(false)
  return (
    <button
      className="px-3 py-1 rounded border"
      disabled={done}
      onClick={async () => {
        await fetch(`/api/issues/${id}/vote`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) })
        setDone(true)
      }}
    >
      {done ? 'Upvoted' : 'Upvote'}
    </button>
  )
}

