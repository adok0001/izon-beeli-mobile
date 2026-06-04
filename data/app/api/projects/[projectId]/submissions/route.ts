import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { projectId } = await params
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const supabase = await createServiceClient()

  let query = supabase
    .from('submissions')
    .select('*, task:tasks(source_text, source_language)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { projectId } = await params
  const { task_id, text } = await req.json()

  if (!task_id || !text?.trim()) return new NextResponse('Missing fields', { status: 400 })

  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('submissions')
    .insert({ task_id, project_id: projectId, contributor_id: userId, text: text.trim() })
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
