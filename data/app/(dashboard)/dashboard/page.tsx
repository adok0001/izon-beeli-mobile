export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Org } from '@/types'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = await createClient()
  const { data: orgs } = await supabase
    .from('orgs')
    .select('*')
    .or(`owner_id.eq.${userId},id.in.(select org_id from org_members where user_id = '${userId}')`)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Your organizations</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your data collection projects</p>
        </div>
        <Button asChild>
          <Link href="/org/new"><Plus className="w-4 h-4 mr-2" />New organization</Link>
        </Button>
      </div>

      {!orgs?.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <p className="text-muted-foreground mb-4">No organizations yet.</p>
            <Button asChild><Link href="/org/new">Create your first organization</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(orgs as Org[]).map((org) => (
            <Link key={org.id} href={`/org/${org.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-base">{org.name}</CardTitle>
                  <CardDescription className="capitalize">{org.tier} plan</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
