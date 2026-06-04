import Link from 'next/link'
import { SignedIn, SignedOut } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Globe, Users, FileDown, ShieldCheck } from 'lucide-react'

const features = [
  { icon: Globe, title: 'Any African language', description: 'Create projects for any language — Igbo, Yoruba, Hausa, Swahili, Izon, and beyond.' },
  { icon: Users, title: 'Team workflows', description: 'Invite contributors to collect data, reviewers to verify quality, managers to oversee.' },
  { icon: ShieldCheck, title: 'Quality by design', description: 'Every submission goes through a review queue before it enters your dataset.' },
  { icon: FileDown, title: 'Export anywhere', description: 'Download approved datasets as JSONL or CSV, ready for model training.' },
]

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight">Sabidata</span>
          <Badge variant="secondary">Beta</Badge>
        </div>
        <nav className="flex items-center gap-3">
          <SignedOut>
            <Button variant="ghost" asChild><Link href="/sign-in">Sign in</Link></Button>
            <Button asChild><Link href="/sign-up">Get started free</Link></Button>
          </SignedOut>
          <SignedIn>
            <Button asChild><Link href="/dashboard">Dashboard</Link></Button>
          </SignedIn>
        </nav>
      </header>

      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-6 py-24 text-center">
          <Badge variant="outline" className="mb-6">African language data infrastructure</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight">
            Build AI that understands<br />African languages
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Sabidata helps research teams, AI startups, and language preservation groups collect,
            review, and export high-quality text datasets — for any African language.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild><Link href="/sign-up">Start for free</Link></Button>
            <Button size="lg" variant="outline" asChild><Link href="/sign-in">Request a demo</Link></Button>
          </div>
        </section>

        <section className="border-t bg-muted/30 px-6 py-20">
          <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground mb-12">Start free. Scale when you&apos;re ready.</p>
          <div className="grid sm:grid-cols-2 gap-6 text-left">
            <div className="border rounded-xl p-6 flex flex-col gap-4">
              <div>
                <p className="font-semibold text-lg">Community</p>
                <p className="text-3xl font-bold mt-1">Free</p>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✓ Unlimited public projects</li>
                <li>✓ Unlimited contributors</li>
                <li>✓ JSONL + CSV export</li>
                <li>✓ Review queue</li>
              </ul>
              <Button variant="outline" className="mt-auto" asChild><Link href="/sign-up">Get started</Link></Button>
            </div>
            <div className="border-2 border-primary rounded-xl p-6 flex flex-col gap-4 relative">
              <Badge className="absolute top-4 right-4">Popular</Badge>
              <div>
                <p className="font-semibold text-lg">Professional</p>
                <p className="text-3xl font-bold mt-1">$45<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✓ Private projects</li>
                <li>✓ Up to 5 projects</li>
                <li>✓ Up to 10 team members</li>
                <li>✓ 100GB storage</li>
                <li>✓ Beta feature access</li>
              </ul>
              <Button className="mt-auto" asChild><Link href="/sign-up">Start free trial</Link></Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Sabidata · <Link href="/privacy" className="hover:underline">Privacy</Link> · <Link href="/terms" className="hover:underline">Terms</Link></p>
      </footer>
    </div>
  )
}
