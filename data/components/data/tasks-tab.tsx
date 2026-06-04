'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { Task } from '@/types'

interface Props {
  projectId: string
  taskType: string
  languageName: string
}

export function TasksTab({ projectId, taskType, languageName }: Props) {
  const [task, setTask] = useState<Task | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchNextTask = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/next`)
      if (res.status === 404) { setTask(null); return }
      if (!res.ok) throw new Error()
      setTask(await res.json())
      setText('')
    } catch {
      toast.error('Could not load task')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchNextTask() }, [fetchNextTask])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!task || !text.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: task.id, text: text.trim() }),
      })
      if (!res.ok) throw new Error()
      toast.success('Submitted!')
      fetchNextTask()
    } catch {
      toast.error('Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-muted-foreground text-sm py-12 text-center">Loading task…</div>
  }

  if (!task) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-2">No tasks available right now.</p>
        <p className="text-sm text-muted-foreground">Check back later or ask a project manager to add more.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              {taskType === 'translation' ? 'Translate this sentence' : 'Write a sentence'}
            </CardTitle>
            <Badge variant="secondary">{task.source_language}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium leading-relaxed">{task.source_text}</p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            {taskType === 'translation'
              ? `Your translation in ${languageName}`
              : `Your sentence in ${languageName}`}
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={taskType === 'translation' ? 'Enter your translation…' : 'Write your sentence…'}
            rows={4}
            required
          />
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={submitting || !text.trim()}>
            {submitting ? 'Submitting…' : 'Submit'}
          </Button>
          <Button type="button" variant="ghost" onClick={fetchNextTask}>
            Skip
          </Button>
        </div>
      </form>
    </div>
  )
}
