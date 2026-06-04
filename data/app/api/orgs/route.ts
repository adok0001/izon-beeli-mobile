import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { name } = await req.json()
  if (!name) return new NextResponse('Missing name', { status: 400 })

  const supabase = await createServiceClient()
  const { data: org, error } = await supabase
    .from('orgs')
    .insert({ name, slug: slugify(name), owner_id: userId })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return new NextResponse('Slug already taken', { status: 409 })
    return new NextResponse(error.message, { status: 500 })
  }

  await supabase.from('org_members').insert({ org_id: org.id, user_id: userId, role: 'org_admin' })
  return NextResponse.json(org)
}
