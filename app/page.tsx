'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  const sections = [
    {
      number: '01',
      label: 'The problem',
      heading: 'Sponsors invest. Clubs struggle to prove delivery.',
      tagline: 'We see the gap.',
      img: '/illustrations/sporr-01-problem.png',
      alt: 'Fragmented sponsorship documents',
    },
    {
      number: '02',
      label: 'The transformation',
      heading: 'Sporr brings clarity, structure, and proof to every promise.',
      tagline: 'We close the gap.',
      img: '/illustrations/sporr-02-transformation.png',
      alt: 'Structured delivery checklist',
    },
    {
      number: '03',
      label: 'Match day magic',
      heading: 'Capture proof in seconds. Automatically verified and organised.',
      tagline: 'We make it effortless.',
      img: '/illustrations/sporr-03-matchday.png',
      alt: 'Phone capturing sponsor banner on sideline',
    },
    {
      number: '04',
      label: 'Sponsor perspective',
      heading: 'Complete visibility. Confidence at every step.',
      tagline: 'We build trust.',
      img: '/illustrations/sporr-04-sponsor-visibility.png',
      alt: 'Sponsor dashboard showing verified deliverables',
    },
    {
      number: '05',
      label: 'Operational credibility',
      heading: 'Manage everything. Standardised. Simple. Built for sport.',
      tagline: 'We run the season.',
      img: '/illustrations/sporr-05-operational-credibility.png',
      alt: 'Season operations dashboard',
    },
    {
      number: '06',
      label: 'Trust, scale, future.',
      heading: 'From clubs to federations and enterprise sponsors.',
      tagline: 'We scale impact.',
      img: '/illustrations/sporr-06-infrastructure.png',
      alt: 'Network of clubs, sponsors and federations',
    },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --dark:    #13322A;
          --deep:    #0F2820;
          --surface: #36573B;
          --mid:     #4B9560;
          --sage:    #A8D5BA;
          --sage-lt: #D4EAD9;
          --cream:   #F5F1E6;
          --light:   #F0F5F0;
          --muted:   #6B7D72;
          --accent:  #C0392B;
          --white:   #ffffff;
        }

        html { scroll-behavior: smooth; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--cream);
          color: var(--dark);
          -webkit-font-smoothing: antialiased;
        }

        /* ── NAV ── */
        .nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--dark);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          height: 64px;
          border-bottom: 1px solid rgba(168,213,186,0.12);
        }
        .nav-logo {
          height: 36px;
          width: auto;
        }
        .nav-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .nav-link {
          color: var(--sage);
          text-decoration: none;
          font-size: 14px;
          font-weight: 400;
          transition: color 0.2s;
        }
        .nav-link:hover { color: var(--cream); }
        .nav-cta {
          background: var(--mid);
          color: var(--cream);
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .nav-cta:hover { background: var(--surface); }

        /* ── HERO — Login on top ── */
        .hero {
          background: var(--dark);
          min-height: calc(100vh - 64px);
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
        }

        /* Left — narrative */
        .hero-left {
          padding: 80px 56px 80px 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .hero-eyebrow {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--mid);
          margin-bottom: 24px;
        }
        .hero-headline {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(36px, 4vw, 56px);
          font-weight: 400;
          line-height: 1.1;
          color: var(--cream);
          margin-bottom: 20px;
        }
        .hero-headline em {
          font-style: italic;
          color: var(--sage);
        }
        .hero-sub {
          font-size: 16px;
          font-weight: 300;
          line-height: 1.7;
          color: var(--sage);
          margin-bottom: 40px;
          max-width: 420px;
        }
        .hero-actions {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .btn-primary-hero {
          background: var(--cream);
          color: var(--dark);
          padding: 14px 28px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.2s;
          font-family: 'DM Sans', sans-serif;
          display: inline-block;
        }
        .btn-primary-hero:hover { background: var(--sage-lt); }
        .btn-ghost {
          color: var(--sage);
          font-size: 14px;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s;
        }
        .btn-ghost:hover { color: var(--cream); }

        /* Stat strip */
        .hero-stats {
          display: flex;
          gap: 40px;
          margin-top: 56px;
          padding-top: 40px;
          border-top: 1px solid rgba(168,213,186,0.15);
        }
        .stat-item {}
        .stat-val {
          font-family: 'DM Serif Display', serif;
          font-size: 28px;
          color: var(--cream);
          line-height: 1;
          margin-bottom: 4px;
        }
        .stat-lbl {
          font-size: 12px;
          color: var(--muted);
          letter-spacing: 0.04em;
        }

        /* Right — login panel */
        .hero-right {
          background: var(--deep);
          min-height: calc(100vh - 64px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 56px;
          border-left: 1px solid rgba(168,213,186,0.08);
        }
        .login-panel {
          width: 100%;
          max-width: 360px;
        }
        .login-eyebrow {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 20px;
        }
        .login-title {
          font-family: 'DM Serif Display', serif;
          font-size: 26px;
          color: var(--cream);
          font-weight: 400;
          margin-bottom: 32px;
          line-height: 1.2;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--sage);
          letter-spacing: 0.04em;
        }
        .form-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(168,213,186,0.2);
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 14px;
          color: var(--cream);
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-input::placeholder { color: rgba(168,213,186,0.3); }
        .form-input:focus { border-color: var(--mid); }
        .form-error {
          background: rgba(192,57,43,0.12);
          border: 1px solid rgba(192,57,43,0.3);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: #e07060;
        }
        .btn-login {
          background: var(--mid);
          color: var(--cream);
          border: none;
          border-radius: 8px;
          padding: 14px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.2s;
          margin-top: 4px;
        }
        .btn-login:hover { background: var(--surface); }
        .btn-login:disabled { opacity: 0.5; cursor: not-allowed; }
        .login-footer {
          margin-top: 24px;
          text-align: center;
        }
        .login-footer a {
          color: var(--sage);
          font-size: 13px;
          text-decoration: none;
          transition: color 0.2s;
        }
        .login-footer a:hover { color: var(--cream); }
        .login-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
        }
        .login-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(168,213,186,0.1);
        }
        .login-divider-text {
          font-size: 12px;
          color: var(--muted);
        }
        .btn-sample {
          display: block;
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(168,213,186,0.15);
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 13px;
          color: var(--sage);
          text-align: center;
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-sample:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(168,213,186,0.3);
          color: var(--cream);
        }

        /* ── SCROLL INDICATOR ── */
        .scroll-indicator {
          background: var(--dark);
          display: flex;
          justify-content: center;
          padding: 20px;
          border-top: 1px solid rgba(168,213,186,0.08);
        }
        .scroll-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--muted);
          animation: bounce 2s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(6px); opacity: 1; }
        }

        /* ── SECTIONS ── */
        .sections-intro {
          background: var(--cream);
          text-align: center;
          padding: 96px 40px 72px;
        }
        .sections-intro-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--mid);
          margin-bottom: 16px;
        }
        .sections-intro-headline {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(28px, 3.5vw, 44px);
          font-weight: 400;
          color: var(--dark);
          line-height: 1.15;
          max-width: 640px;
          margin: 0 auto;
        }

        /* Each section alternates layout */
        .section-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 480px;
          border-top: 1px solid var(--sage-lt);
        }
        .section-row:nth-child(even) .section-content { order: 2; }
        .section-row:nth-child(even) .section-illustration { order: 1; }

        .section-content {
          padding: 72px 64px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: var(--cream);
        }
        .section-number {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.14em;
          color: var(--mid);
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .section-label {
          font-size: 11px;
          font-weight: 400;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 20px;
        }
        .section-heading {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(22px, 2.5vw, 32px);
          font-weight: 400;
          color: var(--dark);
          line-height: 1.2;
          margin-bottom: 24px;
          max-width: 480px;
        }
        .section-tagline {
          font-size: 14px;
          font-style: italic;
          color: var(--muted);
          font-family: 'DM Serif Display', serif;
          border-left: 2px solid var(--mid);
          padding-left: 14px;
        }

        .section-illustration {
          background: var(--light);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 56px 48px;
          overflow: hidden;
        }
        .section-illustration img {
          width: 100%;
          max-width: 420px;
          height: auto;
          object-fit: contain;
          border-radius: 12px;
        }

        /* ── CLOSING CTA ── */
        .closing {
          background: var(--dark);
          padding: 120px 40px;
          text-align: center;
        }
        .closing-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--mid);
          margin-bottom: 20px;
        }
        .closing-headline {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(32px, 4vw, 52px);
          font-weight: 400;
          color: var(--cream);
          line-height: 1.15;
          margin-bottom: 12px;
        }
        .closing-sub {
          font-size: 16px;
          color: var(--sage);
          font-weight: 300;
          margin-bottom: 48px;
        }
        .closing-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .btn-closing-primary {
          background: var(--cream);
          color: var(--dark);
          padding: 16px 32px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-closing-primary:hover { background: var(--sage-lt); }
        .btn-closing-ghost {
          color: var(--sage);
          font-size: 14px;
          text-decoration: none;
          transition: color 0.2s;
        }
        .btn-closing-ghost:hover { color: var(--cream); }

        /* ── FOOTER ── */
        .footer {
          background: var(--deep);
          padding: 40px 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(168,213,186,0.08);
        }
        .footer-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .footer-tagline {
          font-size: 12px;
          color: var(--muted);
        }
        .footer-right {
          display: flex;
          gap: 32px;
        }
        .footer-link {
          font-size: 12px;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-link:hover { color: var(--sage); }

        /* ── MOBILE ── */
        @media (max-width: 900px) {
          .nav { padding: 0 20px; }
          .hero { grid-template-columns: 1fr; }
          .hero-left {
            padding: 56px 24px 48px;
            order: 2;
          }
          .hero-right {
            min-height: auto;
            padding: 48px 24px;
            order: 1;
            border-left: none;
            border-bottom: 1px solid rgba(168,213,186,0.08);
          }
          .hero-stats { gap: 24px; }
          .section-row {
            grid-template-columns: 1fr;
            min-height: auto;
          }
          .section-row:nth-child(even) .section-content { order: 1; }
          .section-row:nth-child(even) .section-illustration { order: 2; }
          .section-content { padding: 48px 24px; }
          .section-illustration { padding: 40px 24px; min-height: 280px; }
          .footer { flex-direction: column; gap: 24px; padding: 32px 24px; text-align: center; }
          .footer-right { flex-wrap: wrap; justify-content: center; }
          .sections-intro { padding: 64px 24px 48px; }
          .closing { padding: 80px 24px; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="nav">
        <img
          src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
          alt="Sporr"
          className="nav-logo"
        />
        <div className="nav-right">
          <a href="#how-it-works" className="nav-link">How it works</a>
          <a href="/proof-pack" className="nav-link">Sample report</a>
          <a href="/signup" className="nav-cta">Get started</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        {/* Left — narrative */}
        <div className="hero-left">
          <p className="hero-eyebrow">Sponsorship delivery platform</p>
          <h1 className="hero-headline">
            The sponsorship<br />
            <em>delivery platform.</em>
          </h1>
          <p className="hero-sub">
            Sporr helps sports clubs, athletes, and events document every sponsor commitment —
            and prove delivery with a professional report that wins renewals.
          </p>
          <div className="hero-actions">
            <a href="/signup" className="btn-primary-hero">Get started free</a>
            <a href="#how-it-works" className="btn-ghost">
              See how it works
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3l5 5-5 5M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-val">94%</div>
              <div className="stat-lbl">Average delivery score</div>
            </div>
            <div className="stat-item">
              <div className="stat-val">4.2×</div>
              <div className="stat-lbl">Estimated ROI</div>
            </div>
            <div className="stat-item">
              <div className="stat-val">127</div>
              <div className="stat-lbl">Proof captures / season</div>
            </div>
          </div>
        </div>

        {/* Right — login */}
        <div className="hero-right">
          <div className="login-panel">
            <p className="login-eyebrow">Club login</p>
            <h2 className="login-title">Welcome back</h2>

            <form className="login-form" onSubmit={handleLogin}>
              {error && <div className="form-error">{error}</div>}
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="you@yourclub.no"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>

            <div className="login-divider">
              <div className="login-divider-line" />
              <span className="login-divider-text">or</span>
              <div className="login-divider-line" />
            </div>

            <a
              href="/Sporr-ProofOfPerformance-TunveienFC-SparebankenVest-2526.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-sample"
            >
              See a sample Proof of Performance Report →
            </a>

            <div className="login-footer">
              <a href="/signup">New to Sporr? Create a free account</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── SCROLL INDICATOR ── */}
      <div className="scroll-indicator">
        <div className="scroll-dot" />
      </div>

      {/* ── HOW IT WORKS INTRO ── */}
      <div className="sections-intro" id="how-it-works">
        <p className="sections-intro-label">How it works</p>
        <h2 className="sections-intro-headline">
          From first promise to confident renewal —<br />
          every step documented.
        </h2>
      </div>

      {/* ── SIX SECTIONS ── */}
      <div>
        {sections.map((s, i) => (
          <div className="section-row" key={s.number}>
            <div className="section-content">
              <p className="section-number">{s.number}</p>
              <p className="section-label">{s.label}</p>
              <h3 className="section-heading">{s.heading}</h3>
              <p className="section-tagline">{s.tagline}</p>
            </div>
            <div className="section-illustration">
              <img
                src={s.img}
                alt={s.alt}
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── CLOSING CTA ── */}
      <section className="closing">
        <p className="closing-label">Ready to start</p>
        <h2 className="closing-headline">
          Every promise.<br />
          <em style={{ fontStyle: 'italic', color: 'var(--sage)' }}>Captured and proven.</em>
        </h2>
        <p className="closing-sub">
          Free to start. No credit card required.
        </p>
        <div className="closing-actions">
          <a href="/signup" className="btn-closing-primary">Get started free →</a>
          <a
            href="/Sporr-ProofOfPerformance-TunveienFC-SparebankenVest-2526.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-closing-ghost"
          >
            See a sample report →
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-left">
          <img
            src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
            alt="Sporr"
            style={{ height: '28px', width: 'auto', marginBottom: '4px' }}
          />
          <span className="footer-tagline">The sponsorship delivery platform</span>
        </div>
        <div className="footer-right">
          <a href="/how-it-works" className="footer-link">How it works</a>
          <a href="/signup" className="footer-link">Get started</a>
          <a href="/terms" className="footer-link">Terms</a>
          <a href="/privacy" className="footer-link">Privacy</a>
        </div>
      </footer>
    </>
  )
}
