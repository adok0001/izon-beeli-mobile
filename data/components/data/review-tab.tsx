'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Flag } from 'lucide-react'
import type { Submission } from '@/types'

interface Props { projectId: string }

export function ReviewTab({ projectId }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/submissions?status=pending`)
      setSubmissions(res.ok ? await res.json() : [])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  async function act(submissionId: string, status: 'approved' | 'rejected' | 'flagged') {
    setActing(submissionId)
    try {
      const res = await fetch(`/api/projects/${projectId}/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewer_note: notes[submissionId] || null }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Submission ${status}`)
      setSubmissions((s) => s.filter((x) => x.id !== submissionId))
    } catch {
      toast.error('Action failed')
    } finally {
      setActing(null)
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground py-12 text-center">Loading…</div>

  if (!submissions.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>No pending submissions.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <p className="text-sm text-muted-foreground">{submissions.length} pending</p>
      {submissions.map((s) => (
        <Card key={s.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Source</p>
                <p className="font-medium">{s.task?.source_text ?? '—'}</p>
              </div>
              <Badge variant="outline">{s.task?.source_language}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Submission</p>
              <p className="text-base">{s.text}</p>
            </div>
            <Textarea
              placeholder="Reviewer note (optional)"
              rows={2}
              value={notes[s.id] ?? ''}
              onChange={(e) => setNotes((n) => ({ ...n, [s.id]: e.target.value }))}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => act(s.id, 'approved')} disabled={acting === s.id}>
                <CheckCircle className="w-4 h-4 mr-1" />Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => act(s.id, 'rejected')} disabled={acting === s.id}>
                <XCircle className="w-4 h-4 mr-1" />Reject
              </Button>
              <Button size="sm" variant="outline" onClick={() => act(s.id, 'flagged')} disabled={acting === s.id}>
                <Flag className="w-4 h-4 mr-1" />Flag
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
