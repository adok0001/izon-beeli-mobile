import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between bg-background">
        <Link href="/dashboard" className="font-bold tracking-tight">Sabidata</Link>
        <UserButton afterSignOutUrl="/" />
      </header>
      <main className="flex-1 bg-muted/20">{children}</main>
    </div>
  )
}
