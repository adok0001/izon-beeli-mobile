export function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Create a project',
      body: 'Name your language, define a task type — translation pairs or original sentence collection. Invite your team with role-based access.',
    },
    {
      n: '02',
      title: 'Collect & review',
      body: 'Contributors submit sentences from any device. Reviewers approve, reject, or flag. Every approved entry is traceable.',
    },
    {
      n: '03',
      title: 'Export & build',
      body: 'Download your dataset as JSONL or CSV. Use it to fine-tune models, train embeddings, or publish to HuggingFace.',
    },
  ]

  return (
    <section style={{
      padding: '6rem 2.5rem',
      borderTop: '1px solid var(--border)',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
        color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase',
        marginBottom: '5rem',
      }}>
        § How it works
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'var(--border)' }}>
        {steps.map(({ n, title, body }) => (
          <div key={n} style={{ background: 'var(--surface)', padding: '3rem 2.5rem' }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontStyle: 'italic',
              fontSize: '4rem', color: 'var(--border)',
              lineHeight: 1, marginBottom: '2rem',
              userSelect: 'none',
            }}>
              {n}
            </div>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontStyle: 'italic',
              fontSize: '1.6rem', color: 'var(--cream)',
              lineHeight: 1.2, marginBottom: '1.25rem',
            }}>
              {title}
            </h3>
            <p style={{
              fontFamily: 'var(--font-body)', fontWeight: 300,
              fontSize: '0.9rem', color: 'var(--muted)',
              lineHeight: 1.8,
            }}>
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
