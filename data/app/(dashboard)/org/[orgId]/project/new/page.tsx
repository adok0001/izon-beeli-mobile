'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import Link from 'next/link'

const TASK_TYPES = [
  { value: 'translation', label: 'Translation — translate source sentences into a target language' },
  { value: 'sentence_collection', label: 'Sentence collection — contributors write original sentences' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const { orgId } = useParams<{ orgId: string }>()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    language_name: '',
    language_code: '',
    task_type: 'translation',
    is_public: true,
  })

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/orgs/${orgId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, org_id: orgId }),
      })
      if (!res.ok) throw new Error(await res.text())
      const project = await res.json()
      router.push(`/org/${orgId}/project/${project.id}`)
    } catch {
      toast.error('Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <p className="text-sm text-muted-foreground mb-6">
        <Link href={`/org/${orgId}`} className="hover:underline">Back to organization</Link>
      </p>
      <Card>
        <CardHeader>
          <CardTitle>New project</CardTitle>
          <CardDescription>A project groups related data collection tasks for one language.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Project name</Label>
              <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Yoruba–English sentence pairs" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea id="description" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What is this dataset for?" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="language_name">Language name</Label>
                <Input id="language_name" value={form.language_name} onChange={(e) => set('language_name', e.target.value)} placeholder="e.g. Yoruba" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="language_code">Language code</Label>
                <Input id="language_code" value={form.language_code} onChange={(e) => set('language_code', e.target.value)} placeholder="e.g. yo" required maxLength={10} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Task type</Label>
              <Select value={form.task_type} onValueChange={(v) => set('task_type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Visibility</Label>
              <Select value={form.is_public ? 'public' : 'private'} onValueChange={(v) => set('is_public', v === 'public')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public — anyone can view and contribute</SelectItem>
                  <SelectItem value="private">Private — invite-only (Professional plan)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={loading || !form.name || !form.language_name || !form.language_code}>
              {loading ? 'Creating…' : 'Create project'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
