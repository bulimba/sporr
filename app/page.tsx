'use client'

import Link from 'next/link'

// ── Sporr wordmark — SVG paths, no image tag ──────────────────────────────────
// PATH_1 = main O horseshoe arc (wordmark body colour)
// PATH_2 = broken lower segment (Clay Copper always)
const SPORR_O_ARC   = 'M873.735 347.639C898.493 344.775 922.792 349.648 943.469 363.849C964.779 378.522 979.408 401.039 984.155 426.472C989.607 456.155 982.16 481.366 965.308 505.675C957.877 501.095 950.861 497.807 943.039 494.028C951.244 484.183 956.989 472.528 959.799 460.024C963.871 441.089 960.3 421.313 949.863 404.998C938.576 387.638 922.504 377.041 902.392 372.759C901.94 372.676 901.487 372.599 901.033 372.528C880.508 369.277 859.101 373.103 842.11 385.427C826.478 396.918 816.067 414.162 813.178 433.347C809.468 457.588 816.492 475.116 830.476 494.232C822.176 497.845 815.897 501.472 808.117 505.943C798.035 490.808 791.722 477.724 789.052 459.404C785.108 433.179 791.888 406.471 807.864 385.303C824.374 363.356 846.814 351.416 873.735 347.639Z'
const SPORR_O_BREAK = 'M876.273 500.988C904.427 497.778 932.768 506.786 955.235 523.713C949.48 529.254 944.417 533.62 938.29 538.755C923.817 529.858 914.292 526.66 897.594 524.151C873.104 522.25 856.67 525.977 835.728 538.872C829.3 533.622 824.598 529.559 818.648 523.799C835.706 509.913 854.812 503.743 876.273 500.988Z'
const SPORR_S = 'M438.532 347.689C466.232 344.584 505.581 349.465 529.745 363.724C526.819 371.238 523.812 378.72 520.726 386.17C496.565 374.864 477.723 371.516 451.744 371.626C432.898 371.705 393.747 376.892 396.627 402.78C402.181 452.685 495.21 415.624 524.433 449.977C534.051 461.284 538.333 468.556 538.756 483.329C539.162 529.497 497.926 539.067 461.429 539.876C427.58 540.636 402.505 536.592 371.777 522.545C373.856 516.241 378.482 506.016 381.147 499.586C412.813 514.903 447.612 518.555 482.304 513.625C491.624 512.3 502.467 509.271 508.621 501.656C512.967 496.375 515.004 489.567 514.274 482.767C510.834 450.619 453.621 458.064 430.541 454.825C403.388 451.014 375.226 442.167 372.154 409.224C368.205 366.885 402.263 351.712 438.532 347.689Z'
const SPORR_P = 'M591.69 349.883L652.183 349.793C668.404 349.779 692.625 348.653 707.674 352.793C716.991 355.371 725.488 360.304 732.346 367.117C755.626 390.443 754.804 434.159 731.747 457.175C715.658 473.236 694.163 475.061 672.712 474.606C662.112 474.381 651.277 474.567 640.664 474.525L640.719 449.79C671.678 449.581 715.744 458.654 724.352 419.908C728.319 387.605 709.827 372.875 679.311 373.975C674.024 374.166 668.029 373.994 662.683 374.01L615.998 374.194L615.955 536.93L591.707 536.764L591.69 349.883Z'
const SPORR_R1 = 'M1035.43 349.884L1101.63 349.779C1117.18 349.759 1131.76 348.914 1147.46 351.469C1191.83 358.684 1206.77 412.536 1180.62 445.935C1168.85 460.963 1152.77 464.378 1134.59 466.173C1153.69 487.785 1181.92 515.058 1202.56 536.176L1169.71 536.221L1089.56 454.24C1087.09 451.939 1084.2 449.709 1083.21 446.547C1083.28 446.008 1083.28 444.814 1083.5 444.371C1087.25 436.869 1140.71 450.713 1159.9 432.09C1166.14 426.039 1168.6 418.231 1168.74 409.707C1168.9 400.535 1166.81 391.482 1160.2 384.767C1155.36 379.849 1148.98 376.888 1142.31 375.376C1131.3 372.883 1118.95 373.958 1107.7 373.984L1059.72 374.152C1061.08 425.774 1059.83 483.997 1059.86 536.24L1035.47 536.222L1035.43 349.884Z'
const SPORR_R2 = 'M1246.62 349.875L1312.17 349.807C1327.81 349.78 1343.83 348.82 1359.46 351.591C1403.07 359.319 1417.7 413.269 1391.45 445.997C1379.72 460.624 1363.79 464.578 1345.74 466.108L1413.86 536.156L1381.03 536.212L1303.04 456.941C1299.59 453.51 1295.46 450.323 1293.88 445.95C1293.94 444.993 1293.79 442.698 1295.09 442.617C1309.01 442.651 1323.68 441.158 1337.61 442.158C1371.86 444.615 1391.78 417.024 1372.73 386.625C1363.59 372.027 1336.52 373.922 1319.43 373.972L1271.43 374.171C1270.79 427.888 1271.57 482.37 1271.27 536.215L1246.58 536.273L1246.62 349.875Z'

function SporrWordmark({
  color = '#081216',
  breakColor = '#B8734A',
  width = 90,
}: {
  color?: string
  breakColor?: string
  width?: number
}) {
  const vbW = 1046, vbH = 200
  const height = (width / vbW) * vbH
  return (
    <svg
      viewBox={`371 344 ${vbW} ${vbH}`}
      width={width}
      height={height}
      aria-label="Sporr"
      role="img"
    >
      {[SPORR_S, SPORR_P, SPORR_O_ARC, SPORR_R1, SPORR_R2].map((d, i) => (
        <path key={i} fill={color} d={d} />
      ))}
      <path fill={breakColor} d={SPORR_O_BREAK} />
    </svg>
  )
}

// ── Problem strip icons — thin copper line-art ─────────────────────────────────
const ProblemIcons = {
  obligations: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="4" y="3" width="16" height="21" rx="2" stroke="#B8734A" strokeWidth="1.4"/>
      <path d="M8 9h8M8 13h8M8 17h5" stroke="#B8734A" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="21" cy="21" r="5" fill="#F5F2ED" stroke="#B8734A" strokeWidth="1.4"/>
      <path d="M19 21l1.5 1.5L23 19" stroke="#B8734A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  delivery: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 4L4 9v10l10 5 10-5V9L14 4z" stroke="#B8734A" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M4 9l10 5m0 0l10-5m-10 5v10" stroke="#B8734A" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M9 6.5l10 5" stroke="#B8734A" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 2"/>
    </svg>
  ),
  reporting: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="3" y="5" width="22" height="18" rx="2" stroke="#B8734A" strokeWidth="1.4"/>
      <path d="M8 18l4-5 4 3 4-6" stroke="#B8734A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 9h22" stroke="#B8734A" strokeWidth="1.4"/>
    </svg>
  ),
  renewal: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 5C9 5 5 9 5 14s4 9 9 9 9-4 9-9" stroke="#B8734A" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M23 5v5h-5" stroke="#B8734A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 10v4l3 2" stroke="#B8734A" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
}

// ── System step icons — circle-enclosed, blue accent ─────────────────────────
function SystemStepIcon({ step }: { step: number }) {
  const icons = [
    // 01 Partnership Terms
    <svg key={1} width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M6 10h20M6 16h14M6 22h10" stroke="#E7ECEF" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M22 20l3 3 5-5" stroke="#147BFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    // 02 Deliverables
    <svg key={2} width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="4" y="4" width="10" height="10" rx="1.5" stroke="#E7ECEF" strokeWidth="1.5"/>
      <rect x="18" y="4" width="10" height="10" rx="1.5" stroke="#E7ECEF" strokeWidth="1.5"/>
      <rect x="4" y="18" width="10" height="10" rx="1.5" stroke="#E7ECEF" strokeWidth="1.5"/>
      <path d="M21 23l2 2 4-4" stroke="#147BFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    // 03 Capture Intelligence
    <svg key={3} width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="4" y="8" width="24" height="18" rx="2" stroke="#E7ECEF" strokeWidth="1.5"/>
      <circle cx="16" cy="17" r="5" stroke="#E7ECEF" strokeWidth="1.5"/>
      <circle cx="16" cy="17" r="2" fill="#147BFF"/>
      <path d="M11 8l2-3h6l2 3" stroke="#E7ECEF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    // 04 Renewal Confidence
    <svg key={4} width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M16 4L20 12L28 13.5L22 19.5L23.5 28L16 24L8.5 28L10 19.5L4 13.5L12 12L16 4Z" stroke="#E7ECEF" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 17l2.5 2.5 5-5" stroke="#147BFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
  ]
  return icons[step - 1]
}

// ── Arrow connector for system section ───────────────────────────────────────
function StepConnector() {
  return (
    <div className="hidden md:flex items-center justify-center flex-shrink-0 w-8">
      <svg width="32" height="2" viewBox="0 0 32 2" fill="none">
        <line x1="0" y1="1" x2="28" y2="1" stroke="#147BFF" strokeWidth="0.75" strokeDasharray="3 2" strokeOpacity="0.4"/>
        <path d="M26 -2l4 3-4 3" stroke="#147BFF" strokeWidth="0.75" strokeOpacity="0.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

// ── Trusted-by logos — placeholder wordmarks ─────────────────────────────────
function TrustedLogo({ name }: { name: string }) {
  return (
    <div className="opacity-30 hover:opacity-50 transition-opacity">
      <span
        style={{ fontFamily: 'DM Sans, system-ui, sans-serif' }}
        className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#E7ECEF]"
      >
        {name}
      </span>
    </div>
  )
}

export default function HomePage() {
  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" }}
    >

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10"
        style={{
          height: '64px',
          background: 'rgba(250, 250, 247, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(8,18,22,0.07)',
        }}
      >
        <SporrWordmark color="#081216" breakColor="#B8734A" width={72} />

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ color: '#6E7F86' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#081216')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6E7F86')}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-[13px] font-semibold px-5 py-2 rounded-lg transition-all"
            style={{
              background: '#B8734A',
              color: '#FFFFFF',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#A66840')}
            onMouseLeave={e => (e.currentTarget.style.background = '#B8734A')}
          >
            Create account
          </Link>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      {/*
        Photography: /public/images/hero-stadium-track.jpg
        Place the extracted hero-stadium-track.jpg in your /public/images/ folder.
        The image bleeds through the layout — it is the atmosphere, not a panel.
      */}
      <section
        className="relative overflow-hidden"
        style={{ paddingTop: '64px', minHeight: '92vh' }}
      >
        {/* Full-bleed photography — atmospheric, bleeds into layout */}
        <div
          className="absolute inset-0"
          style={{ zIndex: 0 }}
        >
          <img
            src="/images/hero-stadium-track.jpg"
            alt="Operational verification in real space"
            className="w-full h-full object-cover"
            style={{
              objectPosition: 'center 30%',
            }}
          />
          {/* Gradient — left reads clearly, right bleeds into image */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(105deg, rgba(250,250,247,0.97) 0%, rgba(250,250,247,0.88) 30%, rgba(250,250,247,0.45) 56%, rgba(250,250,247,0.0) 75%)',
            }}
          />
          {/* Bottom fade — blends into next section */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: '160px',
              background: 'linear-gradient(to bottom, transparent 0%, #FAFAF7 100%)',
            }}
          />
        </div>

        {/* Content — positioned left, generous top padding */}
        <div
          className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 flex flex-col justify-center"
          style={{ minHeight: 'calc(92vh - 64px)', paddingTop: '80px', paddingBottom: '80px' }}
        >
          <div style={{ maxWidth: '520px' }}>

            {/* Headline */}
            <h1
              className="font-bold leading-[1.0] tracking-[-0.02em]"
              style={{
                fontSize: 'clamp(44px, 6vw, 72px)',
                color: '#081216',
              }}
            >
              Sponsorship
              <br />
              Accountability.
              <br />
              <span style={{ color: '#B8734A' }}>Proven.</span>
            </h1>

            {/* Subtext */}
            <p
              className="leading-relaxed mt-6"
              style={{
                fontSize: '15px',
                color: '#6E7F86',
                maxWidth: '380px',
                lineHeight: '1.65',
              }}
            >
              The operational verification layer between
              sponsorship terms, delivery evidence, and
              renewal confidence.
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-4 mt-8 flex-wrap">
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 font-semibold rounded-lg transition-all"
                style={{
                  background: '#147BFF',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  padding: '12px 22px',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#0E6AE0')}
                onMouseLeave={e => (e.currentTarget.style.background = '#147BFF')}
              >
                See how it works
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 font-medium transition-colors"
                style={{ fontSize: '14px', color: '#6E7F86' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#081216')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6E7F86')}
              >
                Explore platform
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── PROBLEM STRIP ─────────────────────────────────────────────────── */}
      <section
        style={{
          background: '#FAFAF7',
          paddingTop: '72px',
          paddingBottom: '80px',
          borderTop: '1px solid rgba(8,18,22,0.06)',
        }}
        id="how-it-works"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-6">

            {/* Left anchor — large statement */}
            <div className="md:col-span-1 flex flex-col justify-start">
              <div
                className="w-8 mb-5"
                style={{ height: '2px', background: '#B8734A' }}
              />
              <h2
                className="font-bold leading-tight"
                style={{
                  fontSize: 'clamp(22px, 2.8vw, 30px)',
                  color: '#081216',
                  letterSpacing: '-0.02em',
                }}
              >
                Sponsorships
                <br />
                fail quietly.
              </h2>
            </div>

            {/* Four failure modes */}
            {[
              {
                icon: ProblemIcons.obligations,
                title: 'Obligations become unclear',
                body: 'Terms are agreed, but expectations drift.',
              },
              {
                icon: ProblemIcons.delivery,
                title: 'Delivery becomes fragmented',
                body: 'Activation happens across teams and channels.',
              },
              {
                icon: ProblemIcons.reporting,
                title: 'Reporting becomes inconsistent',
                body: 'Evidence is incomplete, late or hard to verify.',
              },
              {
                icon: ProblemIcons.renewal,
                title: 'Renewal confidence disappears',
                body: 'Value is questioned. Relationships weaken.',
              },
            ].map((item, i) => (
              <div key={i} className="md:col-span-1">
                <div className="mb-4">{item.icon}</div>
                <h3
                  className="font-semibold leading-snug mb-2"
                  style={{ fontSize: '14px', color: '#081216' }}
                >
                  {item.title}
                </h3>
                <p
                  style={{ fontSize: '13px', color: '#6E7F86', lineHeight: '1.6' }}
                >
                  {item.body}
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* ── THE SPORR SYSTEM ──────────────────────────────────────────────── */}
      {/*
        Atmospheric Deep Pine → Carbon Petrol gradient.
        NOT a flat dark slab. Softly graduated, infrastructural.
        Blue telemetry arc geometry — subconscious, structural.
        Step connectors suggest signal/verification flow.
      */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0F2A2E 0%, #081216 55%, #081216 100%)',
          paddingTop: '96px',
          paddingBottom: '96px',
        }}
      >
        {/* Atmospheric blue telemetry arc — infrastructural geometry */}
        <svg
          className="absolute pointer-events-none"
          style={{
            top: '-10%',
            right: '-8%',
            width: '55%',
            height: 'auto',
            opacity: 1,
          }}
          viewBox="0 0 600 600"
          fill="none"
          aria-hidden="true"
        >
          {/* Primary structural arc — slate */}
          <circle cx="480" cy="120" r="340" stroke="#6E7F86" strokeWidth="0.6" strokeOpacity="0.12"/>
          <circle cx="480" cy="120" r="290" stroke="#6E7F86" strokeWidth="0.4" strokeOpacity="0.08"/>
          {/* Blue intelligence arc — signal layer */}
          <circle cx="480" cy="120" r="255" stroke="#147BFF" strokeWidth="0.7" strokeOpacity="0.14"/>
          {/* Copper warmth trace */}
          <circle cx="480" cy="120" r="210" stroke="#B8734A" strokeWidth="0.4" strokeOpacity="0.08"/>
        </svg>

        {/* Secondary arc — lower left counterbalance */}
        <svg
          className="absolute pointer-events-none"
          style={{
            bottom: '-15%',
            left: '-5%',
            width: '35%',
            height: 'auto',
          }}
          viewBox="0 0 400 400"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="0" cy="400" r="280" stroke="#6E7F86" strokeWidth="0.5" strokeOpacity="0.1"/>
          <circle cx="0" cy="400" r="230" stroke="#147BFF" strokeWidth="0.5" strokeOpacity="0.12"/>
        </svg>

        {/* Fogged edge — top transition blends into section below */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: '80px',
            background: 'linear-gradient(to bottom, #FAFAF7 0%, transparent 100%)',
            opacity: 0.06,
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">

            {/* Left — section identity */}
            <div className="md:col-span-3 flex flex-col justify-start">
              <div
                className="w-8 mb-5"
                style={{ height: '2px', background: '#B8734A' }}
              />
              <h2
                className="font-bold leading-tight mb-4"
                style={{
                  fontSize: 'clamp(26px, 3vw, 36px)',
                  color: '#E7ECEF',
                  letterSpacing: '-0.02em',
                }}
              >
                The Sporr
                <br />
                System
              </h2>
              <p
                style={{
                  fontSize: '13.5px',
                  color: '#6E7F86',
                  lineHeight: '1.65',
                  maxWidth: '220px',
                }}
              >
                A proven operational infrastructure that turns commitments into renewal confidence.
              </p>
            </div>

            {/* Right — four operational steps */}
            <div className="md:col-span-9">
              <div className="flex flex-col md:flex-row items-start gap-0 md:gap-0">
                {[
                  {
                    n: '01',
                    title: 'Partnership Terms',
                    body: 'Commitments are defined, structured and aligned across all stakeholders.',
                  },
                  {
                    n: '02',
                    title: 'Deliverables',
                    body: 'Deliverables are captured in real time and verified at source.',
                  },
                  {
                    n: '03',
                    title: 'Capture Intelligence',
                    body: 'Verified evidence is organised into a single source of operational truth.',
                  },
                  {
                    n: '04',
                    title: 'Renewal Confidence',
                    body: 'Proof-of-performance strengthens relationships and secures renewals.',
                  },
                ].map((step, i) => (
                  <div key={i} className="flex flex-row md:flex-col items-start md:items-start flex-1">
                    {/* Step card */}
                    <div
                      className="flex-1 md:flex-none"
                      style={{
                        padding: '24px 20px',
                        borderLeft: i === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                        borderRight: '1px solid rgba(255,255,255,0.07)',
                        borderTop: '1px solid rgba(255,255,255,0.07)',
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                        background: i === 0 || i === 2
                          ? 'rgba(255,255,255,0.02)'
                          : 'transparent',
                      }}
                    >
                      {/* Icon circle */}
                      <div
                        className="flex items-center justify-center mb-5"
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          border: '1px solid rgba(20, 123, 255, 0.2)',
                          background: 'rgba(20, 123, 255, 0.05)',
                        }}
                      >
                        <SystemStepIcon step={i + 1} />
                      </div>

                      {/* Number + signal line */}
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#147BFF',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {step.n}
                        </span>
                        {/* Signal flow line — connects to next step */}
                        {i < 3 && (
                          <svg
                            className="hidden md:block"
                            width="100%"
                            height="1"
                            style={{ flex: 1 }}
                          >
                            <line
                              x1="0" y1="0.5" x2="100%" y2="0.5"
                              stroke="#147BFF"
                              strokeWidth="0.6"
                              strokeDasharray="4 3"
                              strokeOpacity="0.25"
                            />
                          </svg>
                        )}
                      </div>

                      <h3
                        className="font-semibold mb-2 leading-snug"
                        style={{ fontSize: '14px', color: '#E7ECEF' }}
                      >
                        {step.title}
                      </h3>
                      <p
                        style={{ fontSize: '12.5px', color: '#6E7F86', lineHeight: '1.6' }}
                      >
                        {step.body}
                      </p>
                    </div>

                    {/* Mobile connector */}
                    {i < 3 && (
                      <div
                        className="md:hidden w-px self-stretch ml-6"
                        style={{
                          background: 'rgba(20,123,255,0.15)',
                          minHeight: '24px',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Trusted-by strip */}
          <div
            className="mt-16 pt-10 flex flex-col gap-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                color: '#6E7F86',
              }}
            >
BUILT ON A SCANDINAVIAN-DESIGNED PROOF-OF-PERFORMANCE INFRASTRUCTURE THAT GUARANTEES SPONSORSHIP ACCOUNTABILITY WHILE REMOVING ADMINISTRATIVE BURDEN.
            </p>
            <div className="flex items-center gap-8 flex-wrap">
        
            </div>
          </div>

        </div>
      </section>

      {/* ── BOTTOM PROMISE STRIP ──────────────────────────────────────────── */}
      <section
        style={{
          background: '#F5F2ED',
          paddingTop: '72px',
          paddingBottom: '80px',
          borderTop: '1px solid rgba(8,18,22,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            {[
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M14 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" stroke="#081216" strokeWidth="1.4" strokeLinejoin="round"/>
                  </svg>
                ),
                title: 'Trusted Infrastructure',
                body: 'Verification you can rely on. Evidence you can prove.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="9" stroke="#081216" strokeWidth="1.4"/>
                    <path d="M14 8v6l4 2" stroke="#081216" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                ),
                title: 'Operational Clarity',
                body: 'Real-time visibility across every partnership.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M4 20l6-8 5 5 4-7 5 10" stroke="#081216" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: 'Measurable Impact',
                body: 'Data that demonstrates value and performance.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M9 14s1 5 5 5 5-5 5-5" stroke="#081216" strokeWidth="1.4" strokeLinecap="round"/>
                    <path d="M5 10c2-5 16-5 18 0" stroke="#081216" strokeWidth="1.4" strokeLinecap="round"/>
                    <path d="M14 4v4M8 6l2 3M20 6l-2 3" stroke="#B8734A" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                ),
                title: 'Stronger Relationships',
                body: 'Transparency that builds trust and secures renewal.',
              },
            ].map((item, i) => (
              <div key={i}>
                <div className="mb-4">{item.icon}</div>
                <h3
                  className="font-semibold mb-1.5 leading-snug"
                  style={{ fontSize: '14px', color: '#081216' }}
                >
                  {item.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#6E7F86', lineHeight: '1.6' }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div
            className="mt-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
            style={{
              paddingTop: '40px',
              borderTop: '1px solid rgba(8,18,22,0.08)',
            }}
          >
            <div>
              <p
                className="font-bold leading-tight"
                style={{ fontSize: '22px', color: '#081216', letterSpacing: '-0.02em' }}
              >
                Ready to prove your partnerships?
              </p>
              <p style={{ fontSize: '13px', color: '#6E7F86', marginTop: '6px' }}>
                sporr.no · Sponsorship Accountability. Proven.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 font-semibold rounded-lg transition-all"
                style={{
                  background: '#B8734A',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  padding: '12px 22px',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#A66840')}
                onMouseLeave={e => (e.currentTarget.style.background = '#B8734A')}
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 font-medium rounded-lg transition-all"
                style={{
                  border: '1px solid rgba(8,18,22,0.15)',
                  color: '#6E7F86',
                  fontSize: '14px',
                  padding: '12px 18px',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#081216')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6E7F86')}
              >
                Sign in
              </Link>
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}
