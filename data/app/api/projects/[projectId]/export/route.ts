import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { ExportRow } from '@/types'

export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { projectId } = await params
  const format = new URL(req.url).searchParams.get('format') ?? 'jsonl'

  const supabase = await createServiceClient()

  const { data: project } = await supabase
    .from('projects')
    .select('language_name, language_code')
    .eq('id', projectId)
    .single()

  if (!project) return new NextResponse('Project not found', { status: 404 })

  const { data: submissions, error } = await supabase
    .from('submissions')
    .select('text, contributor_id, reviewed_at, task:tasks(source_text, source_language)')
    .eq('project_id', projectId)
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: true })

  if (error) return new NextResponse(error.message, { status: 500 })

  const rows: ExportRow[] = (submissions ?? []).map((s) => ({
    source_text: (s.task as unknown as { source_text: string } | null)?.source_text ?? '',
    source_language: (s.task as unknown as { source_language: string } | null)?.source_language ?? '',
    translation: s.text,
    target_language: project.language_code,
    contributor_id: s.contributor_id,
    reviewed_at: s.reviewed_at ?? '',
  }))

  if (format === 'csv') {
    const header = 'source_text,source_language,translation,target_language,contributor_id,reviewed_at'
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
    const csvRows = rows.map((r) =>
      [r.source_text, r.source_language, r.translation, r.target_language, r.contributor_id, r.reviewed_at]
        .map(escape)
        .join(',')
    )
    const csv = [header, ...csvRows].join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="dataset.csv"`,
      },
    })
  }

  const jsonl = rows.map((r) => JSON.stringify(r)).join('\n')
  return new NextResponse(jsonl, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Content-Disposition': `attachment; filename="dataset.jsonl"`,
    },
  })
}
