'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { slugify } from '@/lib/utils'
import Link from 'next/link'

export default function NewOrgPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) throw new Error(await res.text())
      const org = await res.json()
      router.push(`/org/${org.id}`)
    } catch {
      toast.error('Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <p className="text-sm text-muted-foreground mb-6">
        <Link href="/dashboard" className="hover:underline">Back to dashboard</Link>
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Create organization</CardTitle>
          <CardDescription>An organization holds your data collection projects.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Organization name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lagos NLP Lab" required />
              {name && <p className="text-xs text-muted-foreground">Slug: {slugify(name)}</p>}
            </div>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Creating…' : 'Create organization'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
