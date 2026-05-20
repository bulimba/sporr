'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Logo SVG paths extracted from uploaded files
// Primary (cream text on dark green) — for dark green panel
const LOGO_PRIMARY_PATHS = `<rect x="331" y="304" width="1126" height="280" rx="24" fill="#13322A"/><g fill="#F5F1E6"><path d="M1246.62 349.875L1312.17 349.807C1327.81 349.78 1343.83 348.82 1359.46 351.591C1403.07 359.319 1417.7 413.269 1391.45 445.997C1379.72 460.624 1363.79 464.578 1345.74 466.108L1413.86 536.156L1381.03 536.212L1303.04 456.941C1299.59 453.51 1295.46 450.323 1293.88 445.95C1293.94 444.993 1293.79 442.698 1295.09 442.617C1309.01 442.651 1323.68 441.158 1337.61 442.158C1371.86 444.615 1391.78 417.024 1372.73 386.625C1363.59 372.027 1336.52 373.922 1319.43 373.972L1271.43 374.171C1270.79 427.888 1271.57 482.37 1271.27 536.215L1246.58 536.273L1246.62 349.875Z"/><path d="M1035.43 349.884L1101.63 349.779C1117.18 349.759 1131.76 348.914 1147.46 351.469C1191.83 358.684 1206.77 412.536 1180.62 445.935C1168.85 460.963 1152.77 464.378 1134.59 466.173C1153.69 487.785 1181.92 515.058 1202.56 536.176L1169.71 536.221L1089.56 454.24C1087.09 451.939 1084.2 449.709 1083.21 446.547C1083.28 446.008 1083.28 444.814 1083.5 444.371C1087.25 436.869 1140.71 450.713 1159.9 432.09C1166.14 426.039 1168.6 418.231 1168.74 409.707C1168.9 400.535 1166.81 391.482 1160.2 384.767C1155.36 379.849 1148.98 376.888 1142.31 375.376C1131.3 372.883 1118.95 373.958 1107.7 373.984L1059.72 374.152C1061.08 425.774 1059.83 483.997 1059.86 536.24L1035.47 536.222L1035.43 349.884Z"/><path d="M438.532 347.689C466.232 344.584 505.581 349.465 529.745 363.724C526.819 371.238 523.812 378.72 520.726 386.17C496.565 374.864 477.723 371.516 451.744 371.626C432.898 371.705 393.747 376.892 396.627 402.78C402.181 452.685 495.21 415.624 524.433 449.977C534.051 461.284 538.333 468.556 538.756 483.329C539.162 529.497 497.926 539.067 461.429 539.876C427.58 540.636 402.505 536.592 371.777 522.545C373.856 516.241 378.482 506.016 381.147 499.586C412.813 514.903 447.612 518.555 482.304 513.625C491.624 512.3 502.467 509.271 508.621 501.656C512.967 496.375 515.004 489.567 514.274 482.767C510.834 450.619 453.621 458.064 430.541 454.825C403.388 451.014 375.226 442.167 372.154 409.224C368.205 366.885 402.263 351.712 438.532 347.689Z"/><path d="M591.69 349.883L652.183 349.793C668.404 349.779 692.625 348.653 707.674 352.793C716.991 355.371 725.488 360.304 732.346 367.117C755.626 390.443 754.804 434.159 731.747 457.175C715.658 473.236 694.163 475.061 672.712 474.606C662.112 474.381 651.277 474.567 640.664 474.525L640.719 449.79C671.678 449.581 715.744 458.654 724.352 419.908C728.319 387.605 709.827 372.875 679.311 373.975C674.024 374.166 668.029 373.994 662.683 374.01L615.998 374.194L615.955 536.93L591.707 536.764L591.69 349.883Z"/><path d="M873.735 347.639C898.493 344.775 922.792 349.648 943.469 363.849C964.779 378.522 979.408 401.039 984.155 426.472C989.607 456.155 982.16 481.366 965.308 505.675C957.877 501.095 950.861 497.807 943.039 494.028C951.244 484.183 956.989 472.528 959.799 460.024C963.871 441.089 960.3 421.313 949.863 404.998C938.576 387.638 922.504 377.041 902.392 372.759C901.94 372.676 901.487 372.599 901.033 372.528C880.508 369.277 859.101 373.103 842.11 385.427C826.478 396.918 816.067 414.162 813.178 433.347C809.468 457.588 816.492 475.116 830.476 494.232C822.176 497.845 815.897 501.472 808.117 505.943C798.035 490.808 791.722 477.724 789.052 459.404C785.108 433.179 791.888 406.471 807.864 385.303C824.374 363.356 846.814 351.416 873.735 347.639Z"/><path d="M876.273 500.988C904.427 497.778 932.768 506.786 955.235 523.713C949.48 529.254 944.417 533.62 938.29 538.755C923.817 529.858 914.292 526.66 897.594 524.151C873.104 522.25 856.67 525.977 835.728 538.872C829.3 533.622 824.598 529.559 818.648 523.799C835.706 509.913 854.812 503.743 876.273 500.988Z"/></g>`

// Reversed (dark text on cream) — for cream panel  
const LOGO_REVERSED_PATHS = `<rect x="331" y="304" width="1126" height="280" rx="24" fill="#F5F1E6"/><g fill="#13322A"><path d="M1246.62 349.875L1312.17 349.807C1327.81 349.78 1343.83 348.82 1359.46 351.591C1403.07 359.319 1417.7 413.269 1391.45 445.997C1379.72 460.624 1363.79 464.578 1345.74 466.108L1413.86 536.156L1381.03 536.212L1303.04 456.941C1299.59 453.51 1295.46 450.323 1293.88 445.95C1293.94 444.993 1293.79 442.698 1295.09 442.617C1309.01 442.651 1323.68 441.158 1337.61 442.158C1371.86 444.615 1391.78 417.024 1372.73 386.625C1363.59 372.027 1336.52 373.922 1319.43 373.972L1271.43 374.171C1270.79 427.888 1271.57 482.37 1271.27 536.215L1246.58 536.273L1246.62 349.875Z"/><path d="M1035.43 349.884L1101.63 349.779C1117.18 349.759 1131.76 348.914 1147.46 351.469C1191.83 358.684 1206.77 412.536 1180.62 445.935C1168.85 460.963 1152.77 464.378 1134.59 466.173C1153.69 487.785 1181.92 515.058 1202.56 536.176L1169.71 536.221L1089.56 454.24C1087.09 451.939 1084.2 449.709 1083.21 446.547C1083.28 446.008 1083.28 444.814 1083.5 444.371C1087.25 436.869 1140.71 450.713 1159.9 432.09C1166.14 426.039 1168.6 418.231 1168.74 409.707C1168.9 400.535 1166.81 391.482 1160.2 384.767C1155.36 379.849 1148.98 376.888 1142.31 375.376C1131.3 372.883 1118.95 373.958 1107.7 373.984L1059.72 374.152C1061.08 425.774 1059.83 483.997 1059.86 536.24L1035.47 536.222L1035.43 349.884Z"/><path d="M438.532 347.689C466.232 344.584 505.581 349.465 529.745 363.724C526.819 371.238 523.812 378.72 520.726 386.17C496.565 374.864 477.723 371.516 451.744 371.626C432.898 371.705 393.747 376.892 396.627 402.78C402.181 452.685 495.21 415.624 524.433 449.977C534.051 461.284 538.333 468.556 538.756 483.329C539.162 529.497 497.926 539.067 461.429 539.876C427.58 540.636 402.505 536.592 371.777 522.545C373.856 516.241 378.482 506.016 381.147 499.586C412.813 514.903 447.612 518.555 482.304 513.625C491.624 512.3 502.467 509.271 508.621 501.656C512.967 496.375 515.004 489.567 514.274 482.767C510.834 450.619 453.621 458.064 430.541 454.825C403.388 451.014 375.226 442.167 372.154 409.224C368.205 366.885 402.263 351.712 438.532 347.689Z"/><path d="M591.69 349.883L652.183 349.793C668.404 349.779 692.625 348.653 707.674 352.793C716.991 355.371 725.488 360.304 732.346 367.117C755.626 390.443 754.804 434.159 731.747 457.175C715.658 473.236 694.163 475.061 672.712 474.606C662.112 474.381 651.277 474.567 640.664 474.525L640.719 449.79C671.678 449.581 715.744 458.654 724.352 419.908C728.319 387.605 709.827 372.875 679.311 373.975C674.024 374.166 668.029 373.994 662.683 374.01L615.998 374.194L615.955 536.93L591.707 536.764L591.69 349.883Z"/><path d="M873.735 347.639C898.493 344.775 922.792 349.648 943.469 363.849C964.779 378.522 979.408 401.039 984.155 426.472C989.607 456.155 982.16 481.366 965.308 505.675C957.877 501.095 950.861 497.807 943.039 494.028C951.244 484.183 956.989 472.528 959.799 460.024C963.871 441.089 960.3 421.313 949.863 404.998C938.576 387.638 922.504 377.041 902.392 372.759C901.94 372.676 901.487 372.599 901.033 372.528C880.508 369.277 859.101 373.103 842.11 385.427C826.478 396.918 816.067 414.162 813.178 433.347C809.468 457.588 816.492 475.116 830.476 494.232C822.176 497.845 815.897 501.472 808.117 505.943C798.035 490.808 791.722 477.724 789.052 459.404C785.108 433.179 791.888 406.471 807.864 385.303C824.374 363.356 846.814 351.416 873.735 347.639Z"/><path d="M876.273 500.988C904.427 497.778 932.768 506.786 955.235 523.713C949.48 529.254 944.417 533.62 938.29 538.755C923.817 529.858 914.292 526.66 897.594 524.151C873.104 522.25 856.67 525.977 835.728 538.872C829.3 533.622 824.598 529.559 818.648 523.799C835.706 509.913 854.812 503.743 876.273 500.988Z"/></g>`

// Ghost O paths for watermark — the two O paths only
const GHOST_O_PATHS = `<path d="M873.735 347.639C898.493 344.775 922.792 349.648 943.469 363.849C964.779 378.522 979.408 401.039 984.155 426.472C989.607 456.155 982.16 481.366 965.308 505.675C957.877 501.095 950.861 497.807 943.039 494.028C951.244 484.183 956.989 472.528 959.799 460.024C963.871 441.089 960.3 421.313 949.863 404.998C938.576 387.638 922.504 377.041 902.392 372.759C901.94 372.676 901.487 372.599 901.033 372.528C880.508 369.277 859.101 373.103 842.11 385.427C826.478 396.918 816.067 414.162 813.178 433.347C809.468 457.588 816.492 475.116 830.476 494.232C822.176 497.845 815.897 501.472 808.117 505.943C798.035 490.808 791.722 477.724 789.052 459.404C785.108 433.179 791.888 406.471 807.864 385.303C824.374 363.356 846.814 351.416 873.735 347.639Z"/><path d="M876.273 500.988C904.427 497.778 932.768 506.786 955.235 523.713C949.48 529.254 944.417 533.62 938.29 538.755C923.817 529.858 914.292 526.66 897.594 524.151C873.104 522.25 856.67 525.977 835.728 538.872C829.3 533.622 824.598 529.559 818.648 523.799C835.706 509.913 854.812 503.743 876.273 500.988Z"/>`

function LogoPrimary({ height = 48 }: { height?: number }) {
  const aspect = 1126 / 280
  return (
    <svg height={height} width={height * aspect} viewBox="331 304 1126 280" xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: LOGO_PRIMARY_PATHS }} />
  )
}

function LogoReversed({ height = 48 }: { height?: number }) {
  const aspect = 1126 / 280
  return (
    <svg height={height} width={height * aspect} viewBox="331 304 1126 280" xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: LOGO_REVERSED_PATHS }} />
  )
}

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
    if (authError) { setError(authError.message); setLoading(false); return }
    router.push('/dashboard')
  }

  const sections = [
    { number: '01', label: 'The problem', heading: 'Sponsors invest. Clubs struggle to prove delivery.', tagline: 'We see the gap.', img: '/illustrations/sporr-01-problem.png', dark: false },
    { number: '02', label: 'The transformation', heading: 'Sporr brings clarity, structure, and proof to every promise.', tagline: 'We close the gap.', img: '/illustrations/sporr-02-transformation.png', dark: true },
    { number: '03', label: 'Match day magic', heading: 'Capture proof in seconds. Automatically verified and organised.', tagline: 'We make it effortless.', img: '/illustrations/sporr-03-matchday.png', dark: false },
    { number: '04', label: 'Sponsor perspective', heading: 'Complete visibility. Confidence at every step.', tagline: 'We build trust.', img: '/illustrations/sporr-04-sponsor-visibility.png', dark: true },
    { number: '05', label: 'Operational credibility', heading: 'Manage everything. Standardised. Simple. Built for sport.', tagline: 'We run the season.', img: '/illustrations/sporr-05-operational-credibility.png', dark: false },
    { number: '06', label: 'Trust, scale, future.', heading: 'From clubs to federations and enterprise sponsors.', tagline: 'We scale impact.', img: '/illustrations/sporr-06-infrastructure.png', dark: true },
  ]

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
          position: sticky; top: 0; z-index: 100;
          background: var(--dark);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 56px; height: 72px;
          border-bottom: 1px solid rgba(168,213,186,0.12);
        }
        .nav-right { display: flex; align-items: center; gap: 32px; }
        .nav-link { color: var(--sage); text-decoration: none; font-size: 14px; font-weight: 400; transition: color 0.2s; }
        .nav-link:hover { color: var(--cream); }
        .nav-cta {
          background: var(--mid); color: var(--cream); border: none;
          padding: 11px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;
          cursor: pointer; text-decoration: none; transition: background 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .nav-cta:hover { background: var(--surface); }

        /* ── HERO ── */
        .hero {
          min-height: calc(100vh - 72px);
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        /* Left — dark green */
        .hero-left {
          background: var(--dark);
          padding: 80px 56px 80px 80px;
          display: flex; flex-direction: column; justify-content: center;
          position: relative; overflow: hidden;
        }

        /* Ghost O watermark */
        .ghost-o {
          position: absolute;
          right: -120px; bottom: -120px;
          width: 560px; height: 560px;
          opacity: 0.07;
          pointer-events: none;
        }

        .hero-eyebrow {
          font-size: 11px; font-weight: 500; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--mid); margin-bottom: 28px;
          position: relative; z-index: 1;
        }
        .hero-headline {
          font-size: clamp(36px, 4vw, 54px); font-weight: 300;
          line-height: 1.08; color: var(--cream); margin-bottom: 24px;
          letter-spacing: -0.02em; position: relative; z-index: 1;
        }
        .hero-headline strong { font-weight: 600; color: var(--cream); }
        .hero-sub {
          font-size: 16px; font-weight: 300; line-height: 1.7;
          color: var(--sage); margin-bottom: 44px; max-width: 400px;
          position: relative; z-index: 1;
        }
        .hero-actions { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; position: relative; z-index: 1; }
        .btn-primary-hero {
          background: var(--mid); color: var(--cream);
          padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 500;
          text-decoration: none; transition: background 0.2s;
          font-family: 'DM Sans', sans-serif; display: inline-block;
        }
        .btn-primary-hero:hover { background: var(--surface); }
        .btn-ghost-hero {
          color: var(--sage); font-size: 14px; text-decoration: none;
          display: flex; align-items: center; gap: 6px; transition: color 0.2s;
        }
        .btn-ghost-hero:hover { color: var(--cream); }

        /* Stats */
        .hero-stats {
          display: flex; gap: 40px; margin-top: 56px; padding-top: 40px;
          border-top: 1px solid rgba(168,213,186,0.15);
          position: relative; z-index: 1;
        }
        .stat-val { font-size: 28px; font-weight: 600; color: var(--cream); line-height: 1; margin-bottom: 4px; letter-spacing: -0.02em; }
        .stat-lbl { font-size: 12px; color: var(--muted); }

        /* Right — cream login */
        .hero-right {
          background: var(--cream);
          display: flex; align-items: center; justify-content: center;
          padding: 60px 56px;
          border-left: 1px solid var(--sage-lt);
        }
        .login-panel { width: 100%; max-width: 360px; }
        .login-eyebrow {
          font-size: 11px; font-weight: 500; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--muted); margin-bottom: 20px;
        }
        .login-title {
          font-size: 26px; font-weight: 300; color: var(--dark);
          margin-bottom: 32px; line-height: 1.2; letter-spacing: -0.01em;
        }
        .login-form { display: flex; flex-direction: column; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 12px; font-weight: 500; color: var(--muted); letter-spacing: 0.04em; }
        .form-input {
          background: var(--light); border: 1px solid var(--sage-lt);
          border-radius: 8px; padding: 12px 14px; font-size: 14px; color: var(--dark);
          font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s;
        }
        .form-input::placeholder { color: var(--muted); opacity: 0.5; }
        .form-input:focus { border-color: var(--mid); background: var(--cream); }
        .form-error {
          background: rgba(192,57,43,0.08); border: 1px solid rgba(192,57,43,0.25);
          border-radius: 8px; padding: 10px 14px; font-size: 13px; color: var(--accent);
        }
        .btn-login {
          background: var(--dark); color: var(--cream); border: none;
          border-radius: 8px; padding: 14px; font-size: 15px; font-weight: 500;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: background 0.2s; margin-top: 4px;
        }
        .btn-login:hover { background: var(--surface); }
        .btn-login:disabled { opacity: 0.5; cursor: not-allowed; }
        .login-divider {
          display: flex; align-items: center; gap: 12px; margin: 20px 0;
        }
        .login-divider-line { flex: 1; height: 1px; background: var(--sage-lt); }
        .login-divider-text { font-size: 12px; color: var(--muted); }
        .btn-signup {
          display: block; width: 100%;
          background: transparent; border: 1.5px solid var(--sage-lt);
          border-radius: 8px; padding: 13px 14px; font-size: 14px; font-weight: 500;
          color: var(--dark); text-align: center; text-decoration: none;
          font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s;
        }
        .btn-signup:hover { border-color: var(--dark); background: var(--light); }

        /* ── HOW IT WORKS INTRO ── */
        .sections-intro {
          background: var(--dark); text-align: center;
          padding: 96px 40px 64px;
        }
        .sections-intro-label {
          font-size: 11px; font-weight: 500; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--mid); margin-bottom: 16px;
        }
        .sections-intro-headline {
          font-size: clamp(24px, 3vw, 38px); font-weight: 300;
          color: var(--cream); line-height: 1.2; max-width: 580px;
          margin: 0 auto; letter-spacing: -0.01em;
        }

        /* ── SECTIONS — alternating dark/light illustration panels ── */
        .section-row {
          display: grid; grid-template-columns: 1fr 1fr;
          min-height: 460px;
          border-top: 1px solid var(--sage-lt);
        }
        /* Even rows: flip content/illustration order */
        .section-row.flip .section-content { order: 2; }
        .section-row.flip .section-illustration { order: 1; }

        .section-content {
          padding: 72px 64px; display: flex; flex-direction: column;
          justify-content: center; background: var(--cream);
        }
        .section-number {
          font-size: 11px; font-weight: 500; letter-spacing: 0.14em;
          color: var(--mid); text-transform: uppercase; margin-bottom: 8px;
        }
        .section-label {
          font-size: 11px; font-weight: 400; color: var(--muted);
          text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px;
        }
        .section-heading {
          font-size: clamp(20px, 2.2vw, 28px); font-weight: 400;
          color: var(--dark); line-height: 1.25; margin-bottom: 24px;
          max-width: 440px; letter-spacing: -0.01em;
        }
        .section-tagline {
          font-size: 14px; font-weight: 300; font-style: italic;
          color: var(--muted); border-left: 2px solid var(--mid);
          padding-left: 14px;
        }

        .section-illustration {
          display: flex; align-items: center;
          justify-content: center; padding: 56px 48px; overflow: hidden;
        }
        .section-illustration.light { background: var(--light); }
        .section-illustration.dark  { background: var(--dark); }
        .section-illustration img {
          width: 100%; max-width: 400px; height: auto;
          object-fit: contain; border-radius: 12px;
        }

        /* ── CLOSING ── */
        .closing {
          background: var(--dark); padding: 120px 40px; text-align: center;
          border-top: 1px solid rgba(168,213,186,0.1);
        }
        .closing-label {
          font-size: 11px; font-weight: 500; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--mid); margin-bottom: 20px;
        }
        .closing-headline {
          font-size: clamp(30px, 4vw, 50px); font-weight: 300;
          color: var(--cream); line-height: 1.12; margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        .closing-headline strong { font-weight: 600; color: var(--sage); }
        .closing-sub { font-size: 15px; color: var(--muted); font-weight: 300; margin-bottom: 48px; }
        .closing-actions { display: flex; align-items: center; justify-content: center; gap: 24px; flex-wrap: wrap; }
        .btn-closing-primary {
          background: var(--cream); color: var(--dark);
          padding: 16px 32px; border-radius: 10px; font-size: 15px; font-weight: 500;
          text-decoration: none; transition: background 0.2s; font-family: 'DM Sans', sans-serif;
        }
        .btn-closing-primary:hover { background: var(--sage-lt); }
        .btn-closing-ghost { color: var(--sage); font-size: 14px; text-decoration: none; transition: color 0.2s; }
        .btn-closing-ghost:hover { color: var(--cream); }

        /* ── FOOTER ── */
        .footer {
          background: var(--deep); padding: 40px 80px;
          display: flex; align-items: center; justify-content: space-between;
          border-top: 1px solid rgba(168,213,186,0.08);
        }
        .footer-left { display: flex; flex-direction: column; gap: 8px; }
        .footer-tagline { font-size: 12px; color: var(--muted); }
        .footer-right { display: flex; gap: 32px; }
        .footer-link { font-size: 12px; color: var(--muted); text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: var(--sage); }

        /* ── MOBILE ── */
        @media (max-width: 900px) {
          .nav { padding: 0 20px; }
          .hero { grid-template-columns: 1fr; }
          .hero-left { padding: 56px 24px 48px; order: 2; }
          .hero-right { padding: 48px 24px; order: 1; border-left: none; border-bottom: 1px solid var(--sage-lt); }
          .hero-stats { gap: 24px; }
          .section-row, .section-row.flip { grid-template-columns: 1fr; }
          .section-row.flip .section-content { order: 1; }
          .section-row.flip .section-illustration { order: 2; }
          .section-content { padding: 48px 24px; }
          .section-illustration { padding: 40px 24px; min-height: 260px; }
          .sections-intro { padding: 64px 24px 48px; }
          .closing { padding: 80px 24px; }
          .footer { flex-direction: column; gap: 24px; padding: 32px 24px; text-align: center; }
          .footer-right { flex-wrap: wrap; justify-content: center; }
          .ghost-o { width: 340px; height: 340px; right: -80px; bottom: -80px; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="nav">
        <LogoPrimary height={44} />
        <div className="nav-right">
          <a href="#how-it-works" className="nav-link">How it works</a>
          <a href="/Sporr-ProofOfPerformance-TunveienFC-SparebankenVest-2526.pdf" target="_blank" rel="noopener noreferrer" className="nav-link">Sample report</a>
          <a href="/signup" className="nav-cta">Get started</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">

        {/* Left — dark green with ghost O */}
        <div className="hero-left">
          {/* Ghost O watermark */}
          <svg className="ghost-o" viewBox="785 344 208 202" xmlns="http://www.w3.org/2000/svg">
            <g fill="#F5F1E6" dangerouslySetInnerHTML={{ __html: GHOST_O_PATHS }} />
          </svg>

          <p className="hero-eyebrow">Sponsorship delivery platform</p>
          <h1 className="hero-headline">
            <strong>The sponsorship</strong><br />
            delivery platform.
          </h1>
          <p className="hero-sub">
            Sporr helps sports clubs, athletes, and events document every sponsor
            commitment and prove delivery with a professional report that wins renewals.
          </p>
          <div className="hero-actions">
            <a href="/signup" className="btn-primary-hero">Get started free</a>
            <a href="#how-it-works" className="btn-ghost-hero">
              See how it works
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3l5 5-5 5M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
          <div className="hero-stats">
            <div><div className="stat-val">94%</div><div className="stat-lbl">Average delivery score</div></div>
            <div><div className="stat-val">4.2×</div><div className="stat-lbl">Estimated ROI</div></div>
            <div><div className="stat-val">127</div><div className="stat-lbl">Proof captures / season</div></div>
          </div>
        </div>

        {/* Right — cream login */}
        <div className="hero-right">
          <div className="login-panel">
            <LogoReversed height={40} />
            <p className="login-eyebrow" style={{ marginTop: '32px' }}>Club login</p>
            <h2 className="login-title">Welcome back</h2>
            <form className="login-form" onSubmit={handleLogin}>
              {error && <div className="form-error">{error}</div>}
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input id="email" type="email" className="form-input" placeholder="you@yourclub.no"
                  value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <input id="password" type="password" className="form-input" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
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
            <a href="/signup" className="btn-signup">Create a free account →</a>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <div className="sections-intro" id="how-it-works">
        <p className="sections-intro-label">How it works</p>
        <h2 className="sections-intro-headline">
          From first promise to confident renewal —<br />every step documented.
        </h2>
      </div>

      {/* ── SIX SECTIONS ── */}
      <div>
        {sections.map((s, i) => (
          <div className={`section-row${i % 2 === 1 ? ' flip' : ''}`} key={s.number}>
            <div className="section-content">
              <p className="section-number">{s.number}</p>
              <p className="section-label">{s.label}</p>
              <h3 className="section-heading">{s.heading}</h3>
              <p className="section-tagline">{s.tagline}</p>
            </div>
            <div className={`section-illustration ${s.dark ? 'dark' : 'light'}`}>
              <img src={s.img} alt={s.label} loading="lazy" />
            </div>
          </div>
        ))}
      </div>

      {/* ── CLOSING ── */}
      <section className="closing">
        <p className="closing-label">Ready to start</p>
        <h2 className="closing-headline">
          Every promise.<br />
          <strong>Captured and proven.</strong>
        </h2>
        <p className="closing-sub">Free to start. No credit card required.</p>
        <div className="closing-actions">
          <a href="/signup" className="btn-closing-primary">Get started free →</a>
          <a href="/Sporr-ProofOfPerformance-TunveienFC-SparebankenVest-2526.pdf"
            target="_blank" rel="noopener noreferrer" className="btn-closing-ghost">
            See a sample report →
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-left">
          <LogoPrimary height={36} />
          <span className="footer-tagline">The sponsorship delivery platform</span>
        </div>
        <div className="footer-right">
          <a href="#how-it-works" className="footer-link">How it works</a>
          <a href="/signup" className="footer-link">Get started</a>
          <a href="/terms" className="footer-link">Terms</a>
          <a href="/privacy" className="footer-link">Privacy</a>
        </div>
      </footer>
    </>
  )
}
