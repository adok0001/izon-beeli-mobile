export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Globe, Lock } from 'lucide-react'
import type { Project } from '@/types'

export default async function OrgPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = await createClient()
  const { data: org } = await supabase.from('orgs').select('*').eq('id', orgId).single()
  if (!org) notFound()

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link> / {org.name}
          </p>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <Badge variant="secondary" className="mt-1 capitalize">{org.tier}</Badge>
        </div>
        <Button asChild>
          <Link href={`/org/${orgId}/project/new`}><Plus className="w-4 h-4 mr-2" />New project</Link>
        </Button>
      </div>

      {!projects?.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <p className="text-muted-foreground mb-4">No projects yet.</p>
            <Button asChild><Link href={`/org/${orgId}/project/new`}>Create your first project</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(projects as Project[]).map((project) => (
            <Link key={project.id} href={`/org/${orgId}/project/${project.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{project.name}</CardTitle>
                    {project.is_public
                      ? <Globe className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      : <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
                  </div>
                  <CardDescription>{project.language_name} · {project.task_type.replace('_', ' ')}</CardDescription>
                </CardHeader>
                {project.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
