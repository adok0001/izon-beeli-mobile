import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { orgId } = await params
  const body = await req.json()
  const { name, description, language_name, language_code, task_type, is_public } = body

  if (!name || !language_name || !language_code || !task_type) {
    return new NextResponse('Missing required fields', { status: 400 })
  }

  const supabase = await createServiceClient()

  // Verify user is an org member
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single()

  if (!member || !['org_admin', 'project_manager'].includes(member.role)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert({ name, description: description || null, language_name, language_code, task_type, is_public, org_id: orgId })
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  // Add creator as project manager
  await supabase.from('project_members').insert({
    project_id: project.id,
    user_id: userId,
    role: 'project_manager',
  })

  return NextResponse.json(project)
}
