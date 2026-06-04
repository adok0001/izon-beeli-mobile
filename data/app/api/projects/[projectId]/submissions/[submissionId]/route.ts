import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string; submissionId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { projectId, submissionId } = await params
  const { status, reviewer_note } = await req.json()

  const validStatuses = ['approved', 'rejected', 'flagged']
  if (!validStatuses.includes(status)) {
    return new NextResponse('Invalid status', { status: 400 })
  }

  const supabase = await createServiceClient()

  // Verify reviewer role
  const { data: member } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single()

  if (!member || !['reviewer', 'project_manager'].includes(member.role)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { data, error } = await supabase
    .from('submissions')
    .update({ status, reviewer_note: reviewer_note || null, reviewer_id: userId, reviewed_at: new Date().toISOString() })
    .eq('id', submissionId)
    .eq('project_id', projectId)
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}
