import Link from 'next/link'
import { SignedIn, SignedOut } from '@clerk/nextjs'
import { LanguageAtlas } from '@/components/data/language-atlas'
import { HowItWorks } from '@/components/data/how-it-works'

export default function HomePage() {
  return (
    <div className="noise" style={{ minHeight: '100vh', background: 'var(--ink)' }}>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 2.5rem',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(8,8,6,0.85)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.35rem', color: 'var(--cream)', letterSpacing: '-0.02em' }}>Sabidata</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>β</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <SignedOut>
            <Link href="/sign-in" style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.04em' }}>
              Sign in
            </Link>
            <Link href="/sign-up" style={{
              fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600,
              color: 'var(--ink)', background: 'var(--gold)', padding: '0.45rem 1.1rem',
              borderRadius: '2px', textDecoration: 'none', letterSpacing: '0.02em',
              transition: 'background 0.2s',
            }}>
              Start free ↗
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" style={{
              fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600,
              color: 'var(--ink)', background: 'var(--gold)', padding: '0.45rem 1.1rem',
              borderRadius: '2px', textDecoration: 'none',
            }}>
              Dashboard ↗
            </Link>
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', padding: '0 2.5rem 4rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background meridian lines */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `
            repeating-linear-gradient(90deg, rgba(242,237,228,0.025) 0px, rgba(242,237,228,0.025) 1px, transparent 1px, transparent 12.5vw),
            repeating-linear-gradient(0deg, rgba(242,237,228,0.025) 0px, rgba(242,237,228,0.025) 1px, transparent 1px, transparent 12.5vh)
          `,
        }} />

        {/* Coordinates */}
        <div style={{
          position: 'absolute', top: '7rem', right: '2.5rem',
          fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
          color: 'var(--muted)', letterSpacing: '0.1em', lineHeight: 2,
          textAlign: 'right',
        }}>
          <div>9.0820° N</div>
          <div>8.6753° E</div>
          <div style={{ color: 'var(--gold)', marginTop: '0.5rem' }}>NIGERIA ◦</div>
        </div>

        {/* Stat cluster top-left */}
        <div style={{
          position: 'absolute', top: '7rem', left: '2.5rem',
          display: 'flex', flexDirection: 'column', gap: '1.5rem',
          animation: 'fade-up 1s ease 0.3s both',
        }}>
          {[
            { n: '2,341', label: 'sentences collected' },
            { n: '54', label: 'languages active' },
            { n: '18', label: 'countries' },
          ].map(({ n, label }) => (
            <div key={label}>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '2rem', color: 'var(--cream)', lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.25rem' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Main headline */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', animation: 'fade-up 1s ease 0.1s both' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
            color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase',
            marginBottom: '1.5rem',
          }}>
            African Language Infrastructure ◦ 2025
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 'clamp(3.5rem, 8vw, 7rem)',
            lineHeight: 1.02, letterSpacing: '-0.02em',
            color: 'var(--cream)',
          }}>
            Every language<br />
            <span style={{ color: 'var(--gold)' }}>deserves</span> a dataset.
          </h1>

          <p style={{
            fontFamily: 'var(--font-body)', fontWeight: 300,
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'var(--muted)', marginTop: '2rem', maxWidth: '520px', lineHeight: 1.7,
          }}>
            Sabidata is infrastructure for African language AI. Collect, verify,
            and export high-quality text datasets — one community at a time.
          </p>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem', alignItems: 'center' }}>
            <Link href="/sign-up" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9rem',
              background: 'var(--gold)', color: 'var(--ink)',
              padding: '0.85rem 2rem', borderRadius: '2px', textDecoration: 'none',
              transition: 'transform 0.15s',
            }}>
              Build a dataset ↗
            </Link>
            <a href="#atlas" style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
              color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.08em',
            }}>
              explore the atlas ↓
            </a>
          </div>
        </div>

        {/* Scroll line */}
        <div style={{
          position: 'absolute', bottom: 0, left: '50%',
          width: '1px', height: '80px',
          background: 'linear-gradient(to bottom, transparent, var(--border))',
        }} />
      </section>

      {/* Language Atlas */}
      <section id="atlas" style={{
        padding: '6rem 2.5rem',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              § Language Atlas
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', lineHeight: 1.1 }}>
              Active collection projects
            </h2>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', maxWidth: '220px', textAlign: 'right', lineHeight: 1.8, letterSpacing: '0.05em' }}>
            HOVER TO HEAR AMBIENT SOUND FROM EACH REGION
          </p>
        </div>

        <LanguageAtlas />

        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <Link href="/sign-up" style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.1em',
            color: 'var(--gold)', textDecoration: 'none',
            borderBottom: '1px solid var(--gold-dim)', paddingBottom: '2px',
          }}>
            Start your own project ↗
          </Link>
        </div>
      </section>

      {/* How it works */}
      <HowItWorks />

      {/* Pricing */}
      <section style={{
        padding: '6rem 2.5rem',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4rem' }}>
          § Pricing
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border)', maxWidth: '900px' }}>
          {/* Community */}
          <div style={{ background: 'var(--surface)', padding: '3rem 2.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Community</div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '4rem', color: 'var(--cream)', lineHeight: 1 }}>Free</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', marginTop: '0.5rem', letterSpacing: '0.05em' }}>forever</div>

            <ul style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', listStyle: 'none' }}>
              {['Unlimited public projects', 'Unlimited contributors', 'JSONL + CSV export', 'Review queue'].map(f => (
                <li key={f} style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--cream)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>+</span>{f}
                </li>
              ))}
            </ul>

            <Link href="/sign-up" style={{
              display: 'inline-block', marginTop: '2.5rem',
              fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.1em',
              color: 'var(--cream)', textDecoration: 'none',
              border: '1px solid var(--border)', padding: '0.65rem 1.25rem',
              borderRadius: '2px', transition: 'border-color 0.2s',
            }}>
              Get started
            </Link>
          </div>

          {/* Professional */}
          <div style={{ background: 'var(--surface-raised)', padding: '3rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink)', background: 'var(--gold)', padding: '0.2rem 0.5rem', letterSpacing: '0.1em' }}>
              POPULAR
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Professional</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '4rem', color: 'var(--cream)', lineHeight: 1 }}>$45</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--muted)' }}>/month</div>
            </div>

            <ul style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', listStyle: 'none' }}>
              {['Private projects', 'Up to 5 projects', 'Up to 10 team members', '100GB storage', 'Beta features'].map(f => (
                <li key={f} style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--cream)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>+</span>{f}
                </li>
              ))}
            </ul>

            <Link href="/sign-up" style={{
              display: 'inline-block', marginTop: '2.5rem',
              fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.1em',
              color: 'var(--ink)', background: 'var(--gold)', textDecoration: 'none',
              padding: '0.65rem 1.25rem', borderRadius: '2px',
            }}>
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '3rem 2.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--muted)' }}>Sabidata</div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Sign in', '/sign-in']].map(([label, href]) => (
            <Link key={href} href={href} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.08em' }}>
              {label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
