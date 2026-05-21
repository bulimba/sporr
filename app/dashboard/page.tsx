'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --dark: #13322A; --deep: #0F2820; --surface: #36573B;
          --mid: #4B9560; --sage: #A8D5BA; --sage-lt: #D4EAD9;
          --cream: #F5F1E6; --light: #F0F5F0; --muted: #6B7D72;
          --accent: #C0392B;
        }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--dark); -webkit-font-smoothing: antialiased; }

        /* ── NAV ── */
        .nav {
          position: sticky; top: 0; z-index: 200;
          background: var(--deep);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 56px; height: 68px;
          border-bottom: 1px solid rgba(168,213,186,0.1);
        }
        .nav-logo { height: 48px; width: auto; }
        .nav-right { display: flex; align-items: center; gap: 32px; }
        .nav-link { color: var(--sage); text-decoration: none; font-size: 14px; font-weight: 400; transition: color 0.2s; letter-spacing: 0.01em; white-space: nowrap; }
        .nav-link:hover { color: var(--cream); }

        /* Login dropdown */
        .nav-login-wrap { position: relative; }
        .nav-login-btn {
          background: none; border: 1.5px solid rgba(168,213,186,0.35);
          color: var(--cream); font-size: 14px; font-weight: 500;
          padding: 8px 18px; border-radius: 8px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.2s;
          letter-spacing: 0.01em;
        }
        .nav-login-btn:hover { border-color: var(--sage); background: rgba(168,213,186,0.08); }
        .login-dropdown {
          position: absolute; top: calc(100% + 12px); right: 0;
          background: var(--deep); border: 1px solid rgba(168,213,186,0.15);
          border-radius: 14px; padding: 24px; width: 300px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.4);
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .login-dropdown-title { font-size: 15px; font-weight: 500; color: var(--cream); margin-bottom: 16px; }
        .login-form { display: flex; flex-direction: column; gap: 12px; }
        .form-input {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(168,213,186,0.18);
          border-radius: 8px; padding: 11px 13px; font-size: 14px; color: var(--cream);
          font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; width: 100%;
        }
        .form-input::placeholder { color: rgba(168,213,186,0.3); }
        .form-input:focus { border-color: var(--mid); }
        .form-error { font-size: 12px; color: #e07060; padding: 8px 10px; background: rgba(192,57,43,0.1); border-radius: 6px; }
        .btn-login-submit {
          background: var(--mid); color: var(--cream); border: none;
          border-radius: 8px; padding: 12px; font-size: 14px; font-weight: 500;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.2s;
        }
        .btn-login-submit:hover { background: var(--surface); }
        .btn-login-submit:disabled { opacity: 0.5; }
        .login-signup-link { text-align: center; margin-top: 4px; }
        .login-signup-link a { color: var(--sage); font-size: 12px; text-decoration: none; transition: color 0.2s; }
        .login-signup-link a:hover { color: var(--cream); }

        .nav-cta {
          background: var(--mid); color: var(--cream); border: none;
          padding: 10px 22px; border-radius: 8px; font-size: 14px; font-weight: 500;
          cursor: pointer; text-decoration: none; transition: background 0.2s;
          font-family: 'DM Sans', sans-serif; white-space: nowrap;
        }
        .nav-cta:hover { background: var(--surface); }

        /* ── HERO ── */
        .hero {
          background: var(--dark);
          min-height: calc(100vh - 68px);
          display: grid; grid-template-columns: 1fr 1fr;
          position: relative; overflow: hidden;
        }

        /* Glow effect — stadium light bleed top right */
        .hero::before {
          content: '';
          position: absolute; top: -120px; right: -80px;
          width: 600px; height: 600px;
          background: radial-gradient(ellipse at center, rgba(245,241,230,0.06) 0%, rgba(245,241,230,0.02) 40%, transparent 70%);
          pointer-events: none; z-index: 0;
        }
        /* Secondary glow — lower left */
        .hero::after {
          content: '';
          position: absolute; bottom: 60px; left: 20%;
          width: 400px; height: 300px;
          background: radial-gradient(ellipse at center, rgba(75,149,96,0.08) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        /* Ghost O watermark */
        .ghost-o {
          position: absolute; right: 48%; bottom: -60px;
          width: 480px; height: 480px; opacity: 0.055;
          pointer-events: none; z-index: 0;
        }

        /* Hero left */
        .hero-left {
          padding: 80px 56px 80px 80px;
          display: flex; flex-direction: column; justify-content: center;
          position: relative; z-index: 1;
        }
        .hero-eyebrow {
          font-size: 11px; font-weight: 500; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--mid); margin-bottom: 28px;
        }
        .hero-headline {
          font-size: clamp(40px, 5vw, 64px); font-weight: 300;
          line-height: 1.05; color: var(--cream); margin-bottom: 8px;
          letter-spacing: -0.025em;
        }
        .hero-headline-green {
          font-size: clamp(40px, 5vw, 64px); font-weight: 600;
          line-height: 1.05; color: var(--mid); margin-bottom: 28px;
          letter-spacing: -0.025em;
        }
        .hero-sub {
          font-size: 16px; font-weight: 300; line-height: 1.75;
          color: var(--sage); margin-bottom: 44px; max-width: 420px;
          opacity: 0.9;
        }
        .hero-actions { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .btn-hero-primary {
          background: var(--mid); color: var(--cream);
          padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 500;
          text-decoration: none; transition: background 0.2s;
          font-family: 'DM Sans', sans-serif; display: inline-block;
        }
        .btn-hero-primary:hover { background: var(--surface); }
        .btn-hero-ghost {
          color: var(--sage); font-size: 15px; text-decoration: none;
          display: flex; align-items: center; gap: 6px; transition: color 0.2s; font-weight: 400;
        }
        .btn-hero-ghost:hover { color: var(--cream); }

        /* Hero right — stadium scene */
        .hero-right {
          position: relative; z-index: 1;
          display: flex; align-items: center; justify-content: center;
          padding: 60px 40px 60px 20px;
        }
        .stadium-scene {
          position: relative; width: 100%; max-width: 520px; height: 420px;
        }
        /* Stadium background suggestion — dark gradient with pitch lines */
        .stadium-bg {
          position: absolute; inset: 0; border-radius: 20px;
          background: linear-gradient(135deg, #0a2018 0%, #0f2820 40%, #162d22 100%);
          overflow: hidden;
        }
        /* Pitch lines */
        .stadium-bg::before {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0; height: 60%;
          background:
            linear-gradient(to bottom, transparent 0%, rgba(75,149,96,0.06) 100%);
          border-top: 1px solid rgba(75,149,96,0.15);
        }
        /* Floodlight glow top left */
        .stadium-bg::after {
          content: '';
          position: absolute; top: -40px; left: -40px;
          width: 300px; height: 300px;
          background: radial-gradient(ellipse, rgba(245,241,230,0.12) 0%, transparent 65%);
        }

        /* Sporr signage banner inside stadium */
        .sporr-signage {
          position: absolute; bottom: 32%; left: 8%; right: 8%;
          height: 28px; background: var(--dark);
          border: 1px solid rgba(168,213,186,0.2);
          border-radius: 4px; display: flex; align-items: center;
          padding: 0 12px; gap: 8px; z-index: 2;
        }
        .sporr-signage-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--mid); }

        /* Floating proof capture card */
        .proof-card {
          position: absolute; bottom: 12%; right: 6%; z-index: 3;
          background: rgba(15,40,32,0.95); border: 1px solid rgba(168,213,186,0.2);
          border-radius: 12px; padding: 14px 16px; width: 200px;
          backdrop-filter: blur(12px);
        }
        .proof-card-label {
          font-size: 9px; font-weight: 500; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--mid); margin-bottom: 6px;
        }
        .proof-card-title { font-size: 12px; font-weight: 500; color: var(--cream); margin-bottom: 4px; }
        .proof-card-meta { font-size: 10px; color: var(--sage); opacity: 0.7; margin-bottom: 10px; }
        .proof-card-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
        .proof-card-check {
          width: 14px; height: 14px; border-radius: 50%; background: var(--mid);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .proof-card-check svg { width: 8px; height: 8px; }
        .proof-card-item { font-size: 10px; color: var(--sage); }

        /* Feature callouts right of stadium */
        .callouts {
          position: absolute; right: -10px; top: 50%; transform: translateY(-50%);
          display: flex; flex-direction: column; gap: 14px; z-index: 4;
        }
        .callout {
          display: flex; align-items: center; gap: 8px;
          background: rgba(15,40,32,0.9); border: 1px solid rgba(168,213,186,0.15);
          border-radius: 8px; padding: 8px 12px; white-space: nowrap;
          backdrop-filter: blur(8px);
        }
        .callout-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--mid); flex-shrink: 0; }
        .callout-text { font-size: 11px; color: var(--sage); font-weight: 400; }

        /* ── STATS STRIP ── */
        .stats-strip {
          background: var(--deep);
          border-top: 1px solid rgba(168,213,186,0.08);
          padding: 40px 80px;
          display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1.2fr;
          gap: 0; align-items: center;
        }
        .stat-item { padding: 0 32px; }
        .stat-item:first-child { padding-left: 0; }
        .stat-item + .stat-item { border-left: 1px solid rgba(168,213,186,0.1); }
        .stat-val {
          font-size: 32px; font-weight: 600; color: var(--cream);
          line-height: 1; margin-bottom: 4px; letter-spacing: -0.02em;
        }
        .stat-lbl { font-size: 11px; color: var(--muted); line-height: 1.4; }
        .stat-visual { margin-top: 10px; }
        .stat-visual svg { display: block; }

        /* Verification badge */
        .verify-badge {
          padding: 0 0 0 32px;
          border-left: 1px solid rgba(168,213,186,0.1);
        }
        .verify-badge-inner {
          display: flex; align-items: flex-start; gap: 12px;
        }
        .verify-icon {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1.5px solid var(--mid);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          margin-top: 2px;
        }
        .verify-icon svg { width: 16px; height: 16px; }
        .verify-text { font-size: 13px; color: var(--sage); font-weight: 300; line-height: 1.5; }
        .verify-text strong { font-weight: 500; color: var(--cream); display: block; margin-bottom: 2px; }

        /* ── HOW IT WORKS ── */
        .how-it-works {
          background: var(--cream);
          padding: 96px 80px 80px;
        }
        .hiw-header { text-align: center; margin-bottom: 64px; }
        .hiw-eyebrow {
          font-size: 11px; font-weight: 500; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--mid); margin-bottom: 16px;
        }
        .hiw-headline {
          font-size: clamp(26px, 3vw, 38px); font-weight: 300;
          color: var(--dark); line-height: 1.2; letter-spacing: -0.015em; margin-bottom: 10px;
        }
        .hiw-sub { font-size: 15px; color: var(--muted); font-weight: 300; }

        .hiw-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 280px; gap: 20px; align-items: start; }

        .step-card {
          background: var(--light); border: 1px solid var(--sage-lt);
          border-radius: 16px; overflow: hidden;
        }
        .step-ui {
          background: var(--dark); height: 180px; padding: 16px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .step-ui-row {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.05); border-radius: 6px; padding: 8px 10px;
        }
        .step-ui-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--mid); flex-shrink: 0; }
        .step-ui-dot-done { background: var(--mid); }
        .step-ui-dot-pending { background: rgba(168,213,186,0.3); }
        .step-ui-label { font-size: 10px; color: var(--sage); flex: 1; }
        .step-ui-badge {
          font-size: 9px; font-weight: 500; padding: 2px 6px; border-radius: 4px;
          background: rgba(75,149,96,0.2); color: var(--mid); letter-spacing: 0.05em;
        }
        .step-ui-badge-done { background: var(--mid); color: var(--cream); }

        /* Capture step UI */
        .step-ui-capture {
          background: var(--dark); height: 180px;
          display: flex; align-items: center; justify-content: center; position: relative;
        }
        .capture-ring {
          width: 80px; height: 80px; border-radius: 50%;
          border: 3px solid rgba(245,241,230,0.4);
          display: flex; align-items: center; justify-content: center;
        }
        .capture-btn {
          width: 56px; height: 56px; border-radius: 50%;
          background: var(--cream); display: flex; align-items: center; justify-content: center;
        }
        .capture-btn svg { width: 24px; height: 24px; }
        .capture-tag {
          position: absolute; top: 12px; left: 12px; right: 12px;
          background: rgba(15,40,32,0.9); border-radius: 8px; padding: 8px 10px;
          font-size: 10px; color: var(--sage);
        }
        .capture-tag strong { color: var(--cream); display: block; margin-bottom: 2px; font-size: 11px; }

        /* Deliver step UI */
        .step-ui-deliver {
          background: var(--dark); height: 180px; padding: 12px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
        }
        .photo-thumb {
          border-radius: 6px; background: var(--surface);
          display: flex; align-items: center; justify-content: center;
        }
        .photo-thumb svg { width: 20px; height: 20px; opacity: 0.4; }
        .photo-thumb-check {
          border-radius: 6px; background: rgba(75,149,96,0.15);
          border: 1px solid rgba(75,149,96,0.3);
          display: flex; align-items: center; justify-content: center;
        }
        .photo-thumb-check svg { width: 20px; height: 20px; color: var(--mid); }

        /* Prove step UI */
        .step-ui-prove {
          background: var(--dark); height: 180px; padding: 14px;
        }
        .prove-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .prove-label { font-size: 10px; color: var(--sage); }
        .prove-val { font-size: 18px; font-weight: 600; color: var(--mid); }
        .prove-bar-bg { height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; margin-bottom: 12px; }
        .prove-bar-fill { height: 4px; width: 88%; background: var(--mid); border-radius: 2px; }
        .prove-renewal { font-size: 28px; font-weight: 600; color: var(--cream); text-align: right; }
        .prove-renewal-label { font-size: 10px; color: var(--muted); text-align: right; }

        .step-body { padding: 18px 18px 20px; }
        .step-num {
          width: 24px; height: 24px; border-radius: 50%;
          background: var(--mid); color: var(--cream);
          font-size: 11px; font-weight: 600; display: flex; align-items: center;
          justify-content: center; margin-bottom: 10px;
        }
        .step-title { font-size: 15px; font-weight: 500; color: var(--dark); margin-bottom: 6px; }
        .step-desc { font-size: 13px; color: var(--muted); line-height: 1.5; font-weight: 300; }

        /* Sample report card */
        .sample-card {
          background: var(--dark); border-radius: 16px; padding: 24px;
          display: flex; flex-direction: column; height: 100%;
        }
        .sample-card-label {
          font-size: 11px; font-weight: 500; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--mid); margin-bottom: 10px;
        }
        .sample-card-title { font-size: 17px; font-weight: 400; color: var(--cream); margin-bottom: 8px; line-height: 1.3; }
        .sample-card-sub { font-size: 13px; color: var(--sage); font-weight: 300; margin-bottom: 24px; line-height: 1.5; opacity: 0.8; }
        .sample-card-preview {
          flex: 1; background: var(--surface); border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px; min-height: 120px; overflow: hidden;
        }
        .sample-preview-inner { text-align: center; padding: 20px; }
        .sample-score { font-size: 36px; font-weight: 600; color: var(--mid); line-height: 1; }
        .sample-score-label { font-size: 11px; color: var(--sage); margin-top: 4px; opacity: 0.7; }
        .btn-sample-report {
          display: block; text-align: center;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(168,213,186,0.2);
          border-radius: 8px; padding: 12px; font-size: 13px; font-weight: 500;
          color: var(--cream); text-decoration: none; transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-sample-report:hover { background: rgba(255,255,255,0.1); border-color: rgba(168,213,186,0.4); }

        /* ── ECOSYSTEM ── */
        .ecosystem {
          background: var(--dark); padding: 72px 80px;
          border-top: 1px solid rgba(168,213,186,0.08);
        }
        .eco-inner { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 40px; align-items: center; }
        .eco-left {}
        .eco-stat { font-size: 44px; font-weight: 600; color: var(--mid); letter-spacing: -0.02em; line-height: 1; margin-bottom: 6px; }
        .eco-stat-label { font-size: 13px; color: var(--sage); font-weight: 300; }
        .eco-center { text-align: center; }
        .eco-title { font-size: 22px; font-weight: 300; color: var(--cream); margin-bottom: 32px; letter-spacing: -0.01em; }
        .eco-flow { display: flex; align-items: center; justify-content: center; gap: 0; }
        .eco-node {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .eco-node-icon {
          width: 44px; height: 44px; border-radius: 50%;
          border: 1.5px solid rgba(168,213,186,0.25);
          display: flex; align-items: center; justify-content: center;
        }
        .eco-node-icon.active {
          border-color: var(--mid); background: rgba(75,149,96,0.1);
        }
        .eco-node-icon svg { width: 18px; height: 18px; }
        .eco-node-label { font-size: 11px; color: var(--sage); font-weight: 400; }
        .eco-arrow {
          flex: 1; display: flex; align-items: center; padding: 0 8px; margin-bottom: 20px;
        }
        .eco-arrow-line {
          flex: 1; height: 1px; background: rgba(168,213,186,0.15);
          position: relative;
        }
        .eco-arrow-line::after {
          content: ''; position: absolute; right: -4px; top: -3px;
          width: 0; height: 0;
          border-left: 6px solid rgba(168,213,186,0.25);
          border-top: 4px solid transparent;
          border-bottom: 4px solid transparent;
        }
        .eco-right { text-align: right; }
        .eco-right-title { font-size: 16px; font-weight: 400; color: var(--cream); margin-bottom: 6px; }
        .eco-right-sub { font-size: 13px; color: var(--sage); font-weight: 300; margin-bottom: 16px; opacity: 0.8; }
        .btn-eco {
          display: inline-block; color: var(--mid); font-size: 13px; font-weight: 500;
          text-decoration: none; border-bottom: 1px solid rgba(75,149,96,0.3);
          padding-bottom: 2px; transition: all 0.2s;
        }
        .btn-eco:hover { border-color: var(--mid); }

        /* ── FOOTER ── */
        .footer {
          background: var(--deep);
          border-top: 1px solid rgba(168,213,186,0.08);
        }
        .footer-trust {
          display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
          border-bottom: 1px solid rgba(168,213,186,0.08);
        }
        .trust-item {
          padding: 36px 36px;
          border-right: 1px solid rgba(168,213,186,0.08);
        }
        .trust-item:last-child { border-right: none; }
        .trust-icon { margin-bottom: 12px; }
        .trust-icon svg { width: 20px; height: 20px; color: var(--mid); }
        .trust-title { font-size: 13px; font-weight: 500; color: var(--cream); margin-bottom: 4px; }
        .trust-desc { font-size: 12px; color: var(--muted); line-height: 1.5; font-weight: 300; }
        .footer-bottom {
          display: flex; align-items: center; justify-content: space-between;
          padding: 28px 56px;
        }
        .footer-left { display: flex; flex-direction: column; gap: 6px; }
        .footer-tagline { font-size: 12px; color: var(--muted); }
        .footer-links { display: flex; gap: 28px; }
        .footer-link { font-size: 12px; color: var(--muted); text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: var(--sage); }

        /* ── MOBILE ── */
        @media (max-width: 1024px) {
          .nav { padding: 0 24px; }
          .hero { grid-template-columns: 1fr; min-height: auto; }
          .hero-left { padding: 60px 24px 40px; }
          .hero-right { padding: 0 24px 60px; }
          .stadium-scene { height: 280px; }
          .callouts { display: none; }
          .stats-strip { grid-template-columns: 1fr 1fr; gap: 24px; padding: 40px 24px; }
          .stat-item { padding: 0; border: none !important; }
          .verify-badge { padding: 0; border: none; grid-column: 1 / -1; }
          .how-it-works { padding: 64px 24px; }
          .hiw-grid { grid-template-columns: 1fr; }
          .ecosystem { padding: 56px 24px; }
          .eco-inner { grid-template-columns: 1fr; text-align: center; }
          .eco-right { text-align: center; }
          .footer-trust { grid-template-columns: 1fr 1fr; }
          .trust-item { border-right: none; border-bottom: 1px solid rgba(168,213,186,0.08); }
          .footer-bottom { flex-direction: column; gap: 20px; padding: 24px; text-align: center; }
          .footer-links { flex-wrap: wrap; justify-content: center; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="nav">
        <img
          src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
          alt="Sporr" className="nav-logo"
        />
        <div className="nav-right">
          <a href="#how-it-works" className="nav-link">How it works</a>
          <a href="/Sporr-ProofOfPerformance-TunveienFC-SparebankenVest-2526.pdf"
            target="_blank" rel="noopener noreferrer" className="nav-link">Sample report</a>

          {/* Login dropdown */}
          <div className="nav-login-wrap">
            <button className="nav-login-btn" onClick={() => setLoginOpen(!loginOpen)}>
              Log in
            </button>
            {loginOpen && (
              <div className="login-dropdown">
                <div className="login-dropdown-title">Welcome back</div>
                <form className="login-form" onSubmit={handleLogin}>
                  {error && <div className="form-error">{error}</div>}
                  <input type="email" className="form-input" placeholder="your@club.no"
                    value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                  <input type="password" className="form-input" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
                  <button type="submit" className="btn-login-submit" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign in →'}
                  </button>
                </form>
                <div className="login-signup-link">
                  <a href="/signup">No account? Get started free</a>
                </div>
              </div>
            )}
          </div>

          <a href="/signup" className="nav-cta">Get started free</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        {/* Ghost O watermark */}
        <svg className="ghost-o" viewBox="785 344 208 202" xmlns="http://www.w3.org/2000/svg">
          <g fill="#F5F1E6">
            <path d="M873.735 347.639C898.493 344.775 922.792 349.648 943.469 363.849C964.779 378.522 979.408 401.039 984.155 426.472C989.607 456.155 982.16 481.366 965.308 505.675C957.877 501.095 950.861 497.807 943.039 494.028C951.244 484.183 956.989 472.528 959.799 460.024C963.871 441.089 960.3 421.313 949.863 404.998C938.576 387.638 922.504 377.041 902.392 372.759C901.94 372.676 901.487 372.599 901.033 372.528C880.508 369.277 859.101 373.103 842.11 385.427C826.478 396.918 816.067 414.162 813.178 433.347C809.468 457.588 816.492 475.116 830.476 494.232C822.176 497.845 815.897 501.472 808.117 505.943C798.035 490.808 791.722 477.724 789.052 459.404C785.108 433.179 791.888 406.471 807.864 385.303C824.374 363.356 846.814 351.416 873.735 347.639Z"/>
            <path d="M876.273 500.988C904.427 497.778 932.768 506.786 955.235 523.713C949.48 529.254 944.417 533.62 938.29 538.755C923.817 529.858 914.292 526.66 897.594 524.151C873.104 522.25 856.67 525.977 835.728 538.872C829.3 533.622 824.598 529.559 818.648 523.799C835.706 509.913 854.812 503.743 876.273 500.988Z"/>
          </g>
        </svg>

        {/* Left — headline */}
        <div className="hero-left">
          <p className="hero-eyebrow">Proof of delivery · Sponsorship reporting</p>
          <div className="hero-headline">Every promise.</div>
          <div className="hero-headline-green">Captured and proven.</div>
          <p className="hero-sub">
            Sporr helps clubs, athletes, and events document sponsor commitments,
            capture proof on match day, and generate professional reports
            that build trust and drive renewal.
          </p>
          <div className="hero-actions">
            <a href="/signup" className="btn-hero-primary">Get started free</a>
            <a href="#how-it-works" className="btn-hero-ghost">
              See how it works
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Right — stadium scene */}
        <div className="hero-right">
          <div className="stadium-scene">
            <div className="stadium-bg" />

            {/* Sporr signage on pitch boundary */}
            <div className="sporr-signage">
              <div className="sporr-signage-dot" />
              <img
                src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
                alt="Sporr" style={{ height: '14px', width: 'auto', opacity: 0.8 }}
              />
            </div>

            {/* Floating proof capture card */}
            <div className="proof-card">
              <div className="proof-card-label">Proof captured</div>
              <div className="proof-card-title">LED board exposure</div>
              <div className="proof-card-meta">Gold stand · 14:22 · 19 Apr 2026</div>
              <div className="proof-card-row">
                <div className="proof-card-check">
                  <svg viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="#F5F1E6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="proof-card-item">Geo-tagged · 58.9700°N</div>
              </div>
              <div className="proof-card-row">
                <div className="proof-card-check">
                  <svg viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="#F5F1E6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="proof-card-item">Timestamped · verified</div>
              </div>
            </div>

            {/* Callouts */}
            <div className="callouts">
              {[
                'Geo-tagged & timestamped',
                'Verified on the day',
                'Delivered to your sponsor',
                'Auto-compiled reports',
              ].map(c => (
                <div className="callout" key={c}>
                  <div className="callout-dot" />
                  <span className="callout-text">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div className="stats-strip">
        <div className="stat-item">
          <div className="stat-val">$156B</div>
          <div className="stat-lbl">Global sponsorship market by 2032</div>
          <div className="stat-source">Fortune Business Insights</div>
          <div className="stat-visual">
            {/* Upward growth curve */}
            <svg width="100%" height="32" viewBox="0 0 120 32" preserveAspectRatio="none">
              <path d="M0 28 C20 26 40 22 60 18 C80 14 95 8 120 3" fill="none" stroke="#4B9560" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="120" cy="3" r="2.5" fill="#4B9560"/>
            </svg>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-val">70%+</div>
          <div className="stat-lbl">Sponsor renewal when ROI is measurable</div>
          <div className="stat-source">Guidebook</div>
          <div className="stat-visual">
            {/* Bar — 70% filled */}
            <svg width="100%" height="32" viewBox="0 0 120 32">
              <rect x="0" y="20" width="120" height="6" rx="3" fill="rgba(168,213,186,0.12)"/>
              <rect x="0" y="20" width="84" height="6" rx="3" fill="#4B9560"/>
              <text x="84" y="14" font-family="DM Sans, sans-serif" font-size="9" fill="#4B9560" text-anchor="middle">70%</text>
              <text x="112" y="14" font-family="DM Sans, sans-serif" font-size="9" fill="rgba(168,213,186,0.35)" text-anchor="middle">30%</text>
            </svg>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-val">40%</div>
          <div className="stat-lbl">Sponsors dissatisfied with current measurement</div>
          <div className="stat-source">Bottom Line Analytics</div>
          <div className="stat-visual">
            {/* Arc / partial donut */}
            <svg width="100%" height="32" viewBox="0 0 120 36">
              <circle cx="32" cy="20" r="14" fill="none" stroke="rgba(168,213,186,0.12)" strokeWidth="5"/>
              <circle cx="32" cy="20" r="14" fill="none" stroke="#4B9560" strokeWidth="5"
                strokeDasharray="35 53" strokeDashoffset="22" strokeLinecap="round"/>
              <text x="60" y="16" font-family="DM Sans, sans-serif" font-size="9" fill="rgba(168,213,186,0.5)">Dissatisfied</text>
              <text x="60" y="28" font-family="DM Sans, sans-serif" font-size="9" fill="rgba(168,213,186,0.25)">Satisfied</text>
            </svg>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-val">68%</div>
          <div className="stat-lbl">Potential error in sponsorship measurement</div>
          <div className="stat-source">Nielsen Sports</div>
          <div className="stat-visual">
            {/* Jagged erratic line — measurement noise */}
            <svg width="100%" height="32" viewBox="0 0 120 32" preserveAspectRatio="none">
              <path d="M0 16 L12 8 L24 22 L36 6 L48 20 L60 10 L72 24 L84 8 L96 18 L108 6 L120 14"
                fill="none" stroke="rgba(192,57,43,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M0 16 C30 16 90 16 120 16" fill="none" stroke="rgba(168,213,186,0.2)" strokeWidth="1" strokeDasharray="4 3"/>
            </svg>
          </div>
        </div>
        <div className="verify-badge">
          <div className="verify-badge-inner">
            <div className="verify-icon">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1.5L10 5.5L14.5 6.2L11.5 9.1L12.2 13.5L8 11.4L3.8 13.5L4.5 9.1L1.5 6.2L6 5.5L8 1.5Z" stroke="#4B9560" strokeWidth="1.25" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="verify-text">
              <strong>Sponsors renew when value is visible.</strong>
              Sporr documents commitments, captures proof, and generates reports that build trust and drive renewal.
            </div>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section className="how-it-works" id="how-it-works">
        <div className="hiw-header">
          <p className="hiw-eyebrow">How it works</p>
          <h2 className="hiw-headline">From promise to proof — in four simple steps</h2>
          <p className="hiw-sub">Built for volunteers. Loved by sponsors.</p>
        </div>

        <div className="hiw-grid">
          {/* Step 1 — Plan */}
          <div className="step-card">
            <div className="step-ui">
              {[
                { label: 'LED board exposure', done: true },
                { label: 'Jersey logo', done: true },
                { label: 'Social media post', done: false },
                { label: 'Programme ad', done: false },
              ].map(item => (
                <div className="step-ui-row" key={item.label}>
                  <div className={`step-ui-dot ${item.done ? 'step-ui-dot-done' : 'step-ui-dot-pending'}`} />
                  <div className="step-ui-label">{item.label}</div>
                  {item.done && <div className="step-ui-badge step-ui-badge-done">✓</div>}
                </div>
              ))}
            </div>
            <div className="step-body">
              <div className="step-num">1</div>
              <div className="step-title">Plan</div>
              <div className="step-desc">Every commitment. Every asset. All in one place.</div>
            </div>
          </div>

          {/* Step 2 — Capture */}
          <div className="step-card">
            <div className="step-ui-capture">
              <div className="capture-tag">
                <strong>Sparebanken Vest — Sideline banner</strong>
                Tap to capture proof
              </div>
              <div className="capture-ring">
                <div className="capture-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#13322A" strokeWidth="1.75" strokeLinecap="round">
                    <rect x="2" y="6" width="20" height="15" rx="3"/>
                    <circle cx="12" cy="13" r="4"/>
                    <path d="M8 6l1.5-2.5h5L16 6"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="step-body">
              <div className="step-num">2</div>
              <div className="step-title">Capture</div>
              <div className="step-desc">On match day. Geo-tagged proof in seconds.</div>
            </div>
          </div>

          {/* Step 3 — Deliver */}
          <div className="step-card">
            <div className="step-ui-deliver">
              {[true, true, true, false].map((done, i) => (
                done
                  ? <div className="photo-thumb-check" key={i}>
                      <svg viewBox="0 0 20 20" fill="none"><path d="M4 10l5 5 7-7" stroke="#4B9560" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  : <div className="photo-thumb" key={i}>
                      <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="5" width="14" height="11" rx="2" stroke="#A8D5BA" strokeWidth="1.5"/><circle cx="10" cy="10" r="3" stroke="#A8D5BA" strokeWidth="1.5"/></svg>
                    </div>
              ))}
            </div>
            <div className="step-body">
              <div className="step-num">3</div>
              <div className="step-title">Deliver</div>
              <div className="step-desc">Automatically compiled and sent to your sponsor.</div>
            </div>
          </div>

          {/* Step 4 — Prove */}
          <div className="step-card">
            <div className="step-ui-prove">
              <div className="prove-row">
                <div className="prove-label">Delivery rate</div>
                <div className="prove-val">94%</div>
              </div>
              <div className="prove-bar-bg"><div className="prove-bar-fill" /></div>
              <div className="prove-renewal">4.2x</div>
              <div className="prove-renewal-label">Estimated ROI</div>
            </div>
            <div className="step-body">
              <div className="step-num">4</div>
              <div className="step-title">Prove</div>
              <div className="step-desc">Professional reporting builds trust and drives renewals.</div>
            </div>
          </div>

          {/* Sample report card */}
          <div className="sample-card">
            <div className="sample-card-label">See it in action</div>
            <div className="sample-card-title">Explore a live proof report from start to finish.</div>
            <div className="sample-card-sub">See exactly what your sponsor receives at the end of the season.</div>
            <div className="sample-card-preview">
              <div className="sample-preview-inner">
                <div className="sample-score">94%</div>
                <div className="sample-score-label">Season delivery score</div>
              </div>
            </div>
            <a href="/Sporr-ProofOfPerformance-TunveienFC-SparebankenVest-2526.pdf"
              target="_blank" rel="noopener noreferrer" className="btn-sample-report">
              View sample report →
            </a>
          </div>
        </div>
      </section>

      {/* ── ECOSYSTEM ── */}
      <section className="ecosystem">
        <div className="eco-inner">
          <div className="eco-left">
            <div className="eco-stat">135,000+</div>
            <div className="eco-stat-label">Clubs ready for better reporting</div>
          </div>
          <div className="eco-center">
            <div className="eco-title">One platform for the entire ecosystem</div>
            <div className="eco-flow">
              {[
                { label: 'Clubs', active: false },
                { label: 'Sponsors', active: false },
                { label: 'Sporr', active: true },
                { label: 'Agencies', active: false },
                { label: 'CSR Funders', active: false },
              ].map((node, i, arr) => (
                <>
                  <div className="eco-node" key={node.label}>
                    <div className={`eco-node-icon ${node.active ? 'active' : ''}`}>
                      <svg viewBox="0 0 18 18" fill="none" stroke={node.active ? '#4B9560' : '#A8D5BA'} strokeWidth="1.25">
                        {node.active
                          ? <path d="M9 2L11 7H16L12 10.5L13.5 16L9 13L4.5 16L6 10.5L2 7H7L9 2Z"/>
                          : <circle cx="9" cy="9" r="5"/>
                        }
                      </svg>
                    </div>
                    <div className="eco-node-label">{node.label}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="eco-arrow" key={`arrow-${i}`}>
                      <div className="eco-arrow-line" />
                    </div>
                  )}
                </>
              ))}
            </div>
          </div>
          <div className="eco-right">
            <div className="eco-right-title">One standard. Endless impact.</div>
            <div className="eco-right-sub">From grassroots clubs to enterprise sponsors and national federations.</div>
            <a href="/signup" className="btn-eco">See all solutions →</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-trust">
          {[
            {
              icon: <path d="M12 2L3 7v5c0 4.5 3.8 8.7 9 10 5.2-1.3 9-5.5 9-10V7l-9-5z" stroke="#4B9560" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>,
              title: 'No app download',
              desc: 'Volunteers access the field auditor from a QR code in their mobile browser',
            },
            {
              icon: <><circle cx="9" cy="9" r="6" stroke="#4B9560" strokeWidth="1.5" fill="none"/><circle cx="15" cy="15" r="6" stroke="#4B9560" strokeWidth="1.5" fill="none" opacity="0.5"/></>,
              title: 'Multi-sponsor',
              desc: 'One session captures proof for all sponsors simultaneously',
            },
            {
              icon: <><rect x="3" y="5" width="13" height="10" rx="2" stroke="#4B9560" strokeWidth="1.5" fill="none"/><path d="M7 10l2 2 4-4" stroke="#4B9560" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></>,
              title: 'Verified proof',
              desc: 'Every photo is timestamped and geo-tagged automatically',
            },
            {
              icon: <><rect x="4" y="4" width="12" height="12" rx="2" stroke="#4B9560" strokeWidth="1.5" fill="none"/><path d="M8 10l2 2 4-4" stroke="#4B9560" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></>,
              title: 'GDPR compliant',
              desc: 'All data stored in the EU — clubs control their own data',
            },
          ].map(item => (
            <div className="trust-item" key={item.title}>
              <div className="trust-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {item.icon}
                </svg>
              </div>
              <div className="trust-title">{item.title}</div>
              <div className="trust-desc">{item.desc}</div>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <div className="footer-left">
            <img
              src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
              alt="Sporr" style={{ height: '36px', width: 'auto' }}
            />
            <span className="footer-tagline">The sponsorship delivery platform</span>
          </div>
          <div className="footer-links">
            <a href="#how-it-works" className="footer-link">How it works</a>
            <a href="/signup" className="footer-link">Get started</a>
            <a href="/terms" className="footer-link">Terms</a>
            <a href="/privacy" className="footer-link">Privacy</a>
          </div>
        </div>
      </footer>
    </>
  )
}
