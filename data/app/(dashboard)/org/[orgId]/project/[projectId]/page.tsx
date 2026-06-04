export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Globe, Lock } from 'lucide-react'
import { TasksTab } from '@/components/data/tasks-tab'
import { ReviewTab } from '@/components/data/review-tab'
import { ExportTab } from '@/components/data/export-tab'
import { pct } from '@/lib/utils'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>
}) {
  const { orgId, projectId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (!project) notFound()

  const [{ count: totalTasks }, { count: totalSubmissions }, { count: approved }] =
    await Promise.all([
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
      supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
      supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('status', 'approved'),
    ])

  const { data: member } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()

  const canReview = member?.role === 'reviewer' || member?.role === 'project_manager'

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-2">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          {' / '}
          <Link href={`/org/${orgId}`} className="hover:underline">{orgId}</Link>
          {' / '}{project.name}
        </p>
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {project.name}
              {project.is_public
                ? <Globe className="w-4 h-4 text-muted-foreground" />
                : <Lock className="w-4 h-4 text-muted-foreground" />}
            </h1>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant="outline">{project.language_name}</Badge>
              <Badge variant="outline">{project.task_type.replace('_', ' ')}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: 'Tasks', value: totalTasks ?? 0 },
            { label: 'Submissions', value: totalSubmissions ?? 0 },
            { label: 'Approved', value: `${approved ?? 0} (${pct(approved ?? 0, totalSubmissions ?? 0)}%)` },
          ].map(({ label, value }) => (
            <div key={label} className="border rounded-lg p-4">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="contribute">
        <TabsList>
          <TabsTrigger value="contribute">Contribute</TabsTrigger>
          {canReview && <TabsTrigger value="review">Review</TabsTrigger>}
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="contribute" className="mt-6">
          <TasksTab projectId={projectId} taskType={project.task_type} languageName={project.language_name} />
        </TabsContent>

        {canReview && (
          <TabsContent value="review" className="mt-6">
            <ReviewTab projectId={projectId} />
          </TabsContent>
        )}

        <TabsContent value="export" className="mt-6">
          <ExportTab projectId={projectId} projectName={project.name} approvedCount={approved ?? 0} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
