import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { projectId } = await params
  const supabase = await createServiceClient()

  // Return a task the user hasn't submitted to yet
  const { data: submitted } = await supabase
    .from('submissions')
    .select('task_id')
    .eq('project_id', projectId)
    .eq('contributor_id', userId)

  const excludeIds = submitted?.map((s) => s.task_id) ?? []

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .limit(1)

  if (excludeIds.length) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  const { data: tasks } = await query
  if (!tasks?.length) return new NextResponse('No tasks available', { status: 404 })

  return NextResponse.json(tasks[0])
}
