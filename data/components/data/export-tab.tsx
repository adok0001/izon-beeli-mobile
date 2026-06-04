'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { FileDown } from 'lucide-react'

interface Props {
  projectId: string
  projectName: string
  approvedCount: number
}

export function ExportTab({ projectId, projectName, approvedCount }: Props) {
  const [loading, setLoading] = useState<'jsonl' | 'csv' | null>(null)

  async function download(format: 'jsonl' | 'csv') {
    if (!approvedCount) { toast.error('No approved submissions to export'); return }
    setLoading(format)
    try {
      const res = await fetch(`/api/projects/${projectId}/export?format=${format}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}-${format === 'jsonl' ? 'dataset.jsonl' : 'dataset.csv'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Export failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Export dataset</CardTitle>
          <CardDescription>
            {approvedCount} approved submission{approvedCount !== 1 ? 's' : ''} ready to export.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Button onClick={() => download('jsonl')} disabled={loading !== null || !approvedCount} className="flex-1">
              <FileDown className="w-4 h-4 mr-2" />
              {loading === 'jsonl' ? 'Exporting…' : 'Download JSONL'}
            </Button>
            <Button variant="outline" onClick={() => download('csv')} disabled={loading !== null || !approvedCount} className="flex-1">
              <FileDown className="w-4 h-4 mr-2" />
              {loading === 'csv' ? 'Exporting…' : 'Download CSV'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Exports include: source text, source language, translation, target language, contributor ID, and review date.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
