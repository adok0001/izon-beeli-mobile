'use client'

import { useState, useRef, useCallback } from 'react'

interface Language {
  name: string
  native: string
  region: string
  country: string
  speakers: string
  submissions: number
  contributors: number
  size: 'sm' | 'md' | 'lg'
  ambientLabel: string
  // audioSrc would be a real URL in production e.g. '/audio/ambient/lagos-market.mp3'
  audioSrc?: string
}

const LANGUAGES: Language[] = [
  { name: 'Yoruba', native: 'Yorùbá', region: 'West Africa', country: 'Nigeria', speakers: '47M', submissions: 1204, contributors: 38, size: 'lg', ambientLabel: 'Lagos market' },
  { name: 'Igbo', native: 'Igbo', region: 'West Africa', country: 'Nigeria', speakers: '44M', submissions: 892, contributors: 31, size: 'md', ambientLabel: 'Onitsha riverfront' },
  { name: 'Izon', native: 'Ịjọ', region: 'Niger Delta', country: 'Nigeria', speakers: '2M', submissions: 441, contributors: 14, size: 'sm', ambientLabel: 'Delta creek' },
  { name: 'Swahili', native: 'Kiswahili', region: 'East Africa', country: 'Kenya/TZ', speakers: '200M', submissions: 2103, contributors: 67, size: 'lg', ambientLabel: 'Nairobi CBD' },
  { name: 'Hausa', native: 'هَوُسَ', region: 'Sahel', country: 'Nigeria/Niger', speakers: '77M', submissions: 731, contributors: 24, size: 'md', ambientLabel: 'Kano market' },
  { name: 'Amharic', native: 'አማርኛ', region: 'East Africa', country: 'Ethiopia', speakers: '57M', submissions: 509, contributors: 19, size: 'md', ambientLabel: 'Addis rain' },
  { name: 'Wolof', native: 'Wolof', region: 'West Africa', country: 'Senegal', speakers: '12M', submissions: 228, contributors: 9, size: 'sm', ambientLabel: 'Dakar coast' },
  { name: 'Zulu', native: 'isiZulu', region: 'Southern Africa', country: 'South Africa', speakers: '27M', submissions: 344, contributors: 13, size: 'sm', ambientLabel: 'Durban harbour' },
  { name: 'Twi', native: 'Twi', region: 'West Africa', country: 'Ghana', speakers: '9M', submissions: 186, contributors: 8, size: 'sm', ambientLabel: 'Accra traffic' },
  { name: 'Fula', native: 'Fulfulde', region: 'West Africa', country: 'Multi-country', speakers: '40M', submissions: 97, contributors: 5, size: 'sm', ambientLabel: 'Sahel wind' },
]

const sizeStyles = {
  sm: { minHeight: '180px', fontSize: '1.5rem' },
  md: { minHeight: '240px', fontSize: '2rem' },
  lg: { minHeight: '300px', fontSize: '2.8rem' },
}

function WaveformBars({ active }: { active: boolean }) {
  const bars = [0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.45, 0.75, 0.6, 0.35, 0.85]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '20px' }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: '2px',
            height: `${h * 100}%`,
            background: 'var(--gold)',
            borderRadius: '1px',
            transformOrigin: 'center',
            transform: active ? 'scaleY(1)' : 'scaleY(0.3)',
            transition: `transform ${0.15 + i * 0.04}s ease`,
            animation: active ? `wave-bar ${0.6 + (i % 4) * 0.15}s ease-in-out ${i * 0.06}s infinite` : 'none',
          }}
        />
      ))}
    </div>
  )
}

function LanguageCard({ lang }: { lang: Language }) {
  const [hovered, setHovered] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = useCallback(() => {
    setHovered(true)
    if (lang.audioSrc && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.volume = 0.3
      audioRef.current.play().catch(() => {})
    }
    timeoutRef.current = setTimeout(() => {
      if (audioRef.current) audioRef.current.pause()
    }, 2000)
  }, [lang.audioSrc])

  const handleLeave = useCallback(() => {
    setHovered(false)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [])

  const styles = sizeStyles[lang.size]

  return (
    <div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        position: 'relative',
        background: hovered ? 'var(--surface-raised)' : 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        padding: '1.75rem',
        minHeight: styles.minHeight,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'default',
        transition: 'background 0.25s, border-color 0.25s',
        overflow: 'hidden',
      }}
    >
      {/* Pulse ring on hover */}
      {hovered && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: '40px', height: '40px',
          marginTop: '-20px', marginLeft: '-20px',
          borderRadius: '50%',
          border: '1px solid var(--gold)',
          animation: 'pulse-ring 1.2s ease-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      <div>
        {/* Region tag */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
          color: hovered ? 'var(--gold)' : 'var(--muted)',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          marginBottom: '0.75rem',
          transition: 'color 0.2s',
        }}>
          {lang.country} ◦ {lang.region}
        </div>

        {/* Language name */}
        <div style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: styles.fontSize,
          color: 'var(--cream)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {lang.name}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
          color: 'var(--muted)', marginTop: '0.4rem',
          opacity: hovered ? 0 : 1, transition: 'opacity 0.2s',
        }}>
          {lang.native}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Waveform — visible on hover */}
        <div style={{ height: '20px', opacity: hovered ? 1 : 0, transition: 'opacity 0.3s' }}>
          <WaveformBars active={hovered} />
        </div>

        {/* Ambient label */}
        {hovered && (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
            color: 'var(--gold)', letterSpacing: '0.1em',
            animation: 'fade-up 0.3s ease both',
          }}>
            ◎ {lang.ambientLabel}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.25rem', color: 'var(--cream)', lineHeight: 1 }}>{lang.submissions.toLocaleString()}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.2rem' }}>sentences</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.25rem', color: 'var(--cream)', lineHeight: 1 }}>{lang.contributors}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.2rem' }}>contributors</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.25rem', color: 'var(--cream)', lineHeight: 1 }}>{lang.speakers}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.2rem' }}>speakers</div>
          </div>
        </div>
      </div>

      {/* Hidden audio element — plug in real ambient .mp3 URLs */}
      {lang.audioSrc && (
        <audio ref={audioRef} src={lang.audioSrc} preload="none" />
      )}
    </div>
  )
}

export function LanguageAtlas() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      gap: '1px',
      background: 'var(--border)',
    }}>
      {/* Row 1: lg | sm | md */}
      <div style={{ gridColumn: 'span 5' }}><LanguageCard lang={LANGUAGES[0]} /></div>
      <div style={{ gridColumn: 'span 3' }}><LanguageCard lang={LANGUAGES[2]} /></div>
      <div style={{ gridColumn: 'span 4' }}><LanguageCard lang={LANGUAGES[1]} /></div>

      {/* Row 2: md | lg | sm */}
      <div style={{ gridColumn: 'span 4' }}><LanguageCard lang={LANGUAGES[4]} /></div>
      <div style={{ gridColumn: 'span 5' }}><LanguageCard lang={LANGUAGES[3]} /></div>
      <div style={{ gridColumn: 'span 3' }}><LanguageCard lang={LANGUAGES[6]} /></div>

      {/* Row 3: sm | md | sm | sm */}
      <div style={{ gridColumn: 'span 3' }}><LanguageCard lang={LANGUAGES[7]} /></div>
      <div style={{ gridColumn: 'span 4' }}><LanguageCard lang={LANGUAGES[5]} /></div>
      <div style={{ gridColumn: 'span 3' }}><LanguageCard lang={LANGUAGES[8]} /></div>
      <div style={{ gridColumn: 'span 2' }}><LanguageCard lang={LANGUAGES[9]} /></div>
    </div>
  )
}
