import { redirect } from 'next/navigation'
import { login } from './actions'

// ── SVG path data — Sporr wordmark ────────────────────────────────────────────
const O_ARC   = 'M873.735 347.639C898.493 344.775 922.792 349.648 943.469 363.849C964.779 378.522 979.408 401.039 984.155 426.472C989.607 456.155 982.16 481.366 965.308 505.675C957.877 501.095 950.861 497.807 943.039 494.028C951.244 484.183 956.989 472.528 959.799 460.024C963.871 441.089 960.3 421.313 949.863 404.998C938.576 387.638 922.504 377.041 902.392 372.759C901.94 372.676 901.487 372.599 901.033 372.528C880.508 369.277 859.101 373.103 842.11 385.427C826.478 396.918 816.067 414.162 813.178 433.347C809.468 457.588 816.492 475.116 830.476 494.232C822.176 497.845 815.897 501.472 808.117 505.943C798.035 490.808 791.722 477.724 789.052 459.404C785.108 433.179 791.888 406.471 807.864 385.303C824.374 363.356 846.814 351.416 873.735 347.639Z'
const O_BREAK = 'M876.273 500.988C904.427 497.778 932.768 506.786 955.235 523.713C949.48 529.254 944.417 533.62 938.29 538.755C923.817 529.858 914.292 526.66 897.594 524.151C873.104 522.25 856.67 525.977 835.728 538.872C829.3 533.622 824.598 529.559 818.648 523.799C835.706 509.913 854.812 503.743 876.273 500.988Z'
const S_PATH  = 'M438.532 347.689C466.232 344.584 505.581 349.465 529.745 363.724C526.819 371.238 523.812 378.72 520.726 386.17C496.565 374.864 477.723 371.516 451.744 371.626C432.898 371.705 393.747 376.892 396.627 402.78C402.181 452.685 495.21 415.624 524.433 449.977C534.051 461.284 538.333 468.556 538.756 483.329C539.162 529.497 497.926 539.067 461.429 539.876C427.58 540.636 402.505 536.592 371.777 522.545C373.856 516.241 378.482 506.016 381.147 499.586C412.813 514.903 447.612 518.555 482.304 513.625C491.624 512.3 502.467 509.271 508.621 501.656C512.967 496.375 515.004 489.567 514.274 482.767C510.834 450.619 453.621 458.064 430.541 454.825C403.388 451.014 375.226 442.167 372.154 409.224C368.205 366.885 402.263 351.712 438.532 347.689Z'
const P_PATH  = 'M591.69 349.883L652.183 349.793C668.404 349.779 692.625 348.653 707.674 352.793C716.991 355.371 725.488 360.304 732.346 367.117C755.626 390.443 754.804 434.159 731.747 457.175C715.658 473.236 694.163 475.061 672.712 474.606C662.112 474.381 651.277 474.567 640.664 474.525L640.719 449.79C671.678 449.581 715.744 458.654 724.352 419.908C728.319 387.605 709.827 372.875 679.311 373.975C674.024 374.166 668.029 373.994 662.683 374.01L615.998 374.194L615.955 536.93L591.707 536.764L591.69 349.883Z'
const R1_PATH = 'M1035.43 349.884L1101.63 349.779C1117.18 349.759 1131.76 348.914 1147.46 351.469C1191.83 358.684 1206.77 412.536 1180.62 445.935C1168.85 460.963 1152.77 464.378 1134.59 466.173C1153.69 487.785 1181.92 515.058 1202.56 536.176L1169.71 536.221L1089.56 454.24C1087.09 451.939 1084.2 449.709 1083.21 446.547C1083.28 446.008 1083.28 444.814 1083.5 444.371C1087.25 436.869 1140.71 450.713 1159.9 432.09C1166.14 426.039 1168.6 418.231 1168.74 409.707C1168.9 400.535 1166.81 391.482 1160.2 384.767C1155.36 379.849 1148.98 376.888 1142.31 375.376C1131.3 372.883 1118.95 373.958 1107.7 373.984L1059.72 374.152C1061.08 425.774 1059.83 483.997 1059.86 536.24L1035.47 536.222L1035.43 349.884Z'
const R2_PATH = 'M1246.62 349.875L1312.17 349.807C1327.81 349.78 1343.83 348.82 1359.46 351.591C1403.07 359.319 1417.7 413.269 1391.45 445.997C1379.72 460.624 1363.79 464.578 1345.74 466.108L1413.86 536.156L1381.03 536.212L1303.04 456.941C1299.59 453.51 1295.46 450.323 1293.88 445.95C1293.94 444.993 1293.79 442.698 1295.09 442.617C1309.01 442.651 1323.68 441.158 1337.61 442.158C1371.86 444.615 1391.78 417.024 1372.73 386.625C1363.59 372.027 1336.52 373.922 1319.43 373.972L1271.43 374.171C1270.79 427.888 1271.57 482.37 1271.27 536.215L1246.58 536.273L1246.62 349.875Z'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const errorMessage = searchParams?.error

  return (
    <>
      {/* Global styles for this page only */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .login-page * {
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
        }

        .login-input {
          width: 100%;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(231,236,239,0.12);
          border-radius: 8px;
          padding: 13px 14px 13px 42px;
          color: #E7ECEF;
          font-size: 14px;
          font-family: 'DM Sans', system-ui, sans-serif;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
          -webkit-appearance: none;
        }
        .login-input::placeholder {
          color: rgba(110,127,134,0.8);
        }
        .login-input:focus {
          border-color: rgba(20,123,255,0.45);
          background: rgba(255,255,255,0.09);
        }
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(15,30,36,0.95) inset;
          -webkit-text-fill-color: #E7ECEF;
          caret-color: #E7ECEF;
        }

        .login-btn {
          width: 100%;
          background: #B8734A;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 14px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', system-ui, sans-serif;
          cursor: pointer;
          transition: background 0.15s;
          letter-spacing: 0.01em;
        }
        .login-btn:hover {
          background: #A66840;
        }
        .login-btn:active {
          background: #955C38;
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(110,127,134,0.7);
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }
        .password-toggle:hover {
          color: #E7ECEF;
        }
      `}</style>

      <div
        className="login-page"
        style={{
          minHeight: '100vh',
          width: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: '#081216',
        }}
      >
        {/* ── Background image — foggy night stadium ──────────────────────── */}
        <img
          src="/images/hero-stadium-night_3.jpg"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            opacity: 0.55,
            zIndex: 0,
          }}
        />

        {/* ── Atmospheric overlay — darkens and tones the image ───────────── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(8,18,22,0.72) 0%, rgba(15,30,36,0.55) 100%)',
            zIndex: 1,
          }}
        />

    {/* ── Telemetry arc geometry — right side, subconscious ───────────── */}
{/* Features an on-screen convergence point where the blue and copper orbits meet */}
<svg
  aria-hidden="true"
  style={{
    position: 'absolute',
    right: '-8%',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '52%',
    height: 'auto',
    zIndex: 2,
    pointerEvents: 'none',
  }}
  viewBox="0 0 520 600"
  fill="none"
>
  {/* 1. Large base structural sweep — independent backdrop layer */}
  <circle cx="280" cy="500" r="420" stroke="#6E7F86" strokeWidth="0.5" strokeOpacity="0.08" />

  {/* 2. Main slate arc — one single, clean break to let it breathe */}
  <circle cx="450" cy="270" r="280" stroke="#6E7F86" strokeWidth="0.7" strokeOpacity="0.12" strokeDasharray="500 200" />

  {/* 3. Blue intelligence curve — swoops down and meets the copper line at (300, 290) */}
  <circle cx="560" cy="290" r="260" stroke="#147BFF" strokeWidth="0.7" strokeOpacity="0.16" />

  {/* 4. Copper warmth trace — perfectly touches the blue line's left edge at (300, 290) */}
  <circle cx="490" cy="290" r="190" stroke="#B8734A" strokeWidth="0.7" strokeOpacity="0.18" />

  {/* 5. Fine precision orbit — continuous backdrop vector anchoring the lower section */}
  <circle cx="390" cy="410" r="140" stroke="#147BFF" strokeWidth="0.5" strokeOpacity="0.10" />
</svg>

        {/* ── Login card ───────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            maxWidth: '380px',
            margin: '24px',
            background: 'rgba(10,20,26,0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid rgba(231,236,239,0.09)',
            padding: '36px 32px 32px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.3)',
          }}
        >

          {/* Sporr wordmark — Soft Fog body + Clay Copper break */}
          <div style={{ marginBottom: '32px' }}>
            <svg
              viewBox="371 344 1046 200"
              width="80"
              height="15"
              aria-label="Sporr"
              role="img"
            >
              {[S_PATH, P_PATH, O_ARC, R1_PATH, R2_PATH].map((d, i) => (
                <path key={i} fill="#E7ECEF" d={d} />
              ))}
              <path fill="#B8734A" d={O_BREAK} />
            </svg>
          </div>

          {/* Headline */}
          <h1
            style={{
              color: '#E7ECEF',
              fontSize: '26px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginBottom: '6px',
            }}
          >
            Welcome back
          </h1>
          <p
            style={{
              color: '#6E7F86',
              fontSize: '13.5px',
              marginBottom: '28px',
              lineHeight: 1.4,
            }}
          >
            Operational partnership infrastructure.
          </p>

          {/* Error message */}
          {errorMessage && (
            <div
              style={{
                background: 'rgba(184,115,74,0.12)',
                border: '1px solid rgba(184,115,74,0.25)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '20px',
                color: '#B8734A',
                fontSize: '13px',
                lineHeight: 1.4,
              }}
            >
              {decodeURIComponent(errorMessage)}
            </div>
          )}

          {/* Form */}
          <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Email field */}
            <div style={{ position: 'relative' }}>
              {/* Email icon */}
              <svg
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              >
                <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="#6E7F86" strokeWidth="1.2"/>
                <path d="M1.5 5.5l5.793 4.146a1 1 0 001.414 0L14.5 5.5" stroke="#6E7F86" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <input
                className="login-input"
                type="email"
                name="email"
                placeholder="Email address"
                required
                autoComplete="email"
              />
            </div>

            {/* Password field */}
            <div style={{ position: 'relative' }}>
              {/* Lock icon */}
              <svg
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              >
                <rect x="3" y="7" width="10" height="7.5" rx="1.5" stroke="#6E7F86" strokeWidth="1.2"/>
                <path d="M5 7V5a3 3 0 016 0v2" stroke="#6E7F86" strokeWidth="1.2" strokeLinecap="round"/>
                <circle cx="8" cy="10.5" r="1" fill="#6E7F86"/>
              </svg>
              <input
                className="login-input"
                type="password"
                name="password"
                placeholder="Password"
                required
                autoComplete="current-password"
                style={{ paddingRight: '44px' }}
              />
              {/* Eye toggle — visual only, handled client-side via JS below */}
              <button
                type="button"
                className="password-toggle"
                aria-label="Toggle password visibility"

              >
                <svg className="eye-open" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M1 8C2.5 4.5 13.5 4.5 15 8C13.5 11.5 2.5 11.5 1 8Z" stroke="currentColor" strokeWidth="1.2"/>
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                <svg className="eye-closed" width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: 'none' }}>
                  <path d="M2 2l12 12M6.5 6.7A2 2 0 0010.3 10M4 4.8C2.8 5.8 2 7 1 8c1.5 3.5 12.5 3.5 14 0-.8-1.9-2.3-3.4-4-4.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Submit */}
            <div style={{ marginTop: '4px' }}>
              <button type="submit" className="login-btn">
                Sign in
              </button>
            </div>

          </form>

          {/* Forgot password */}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <a
              href="/forgot-password"
              style={{
                color: '#B8734A',
                fontSize: '13.5px',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}

            >
              Forgot password?
            </a>
          </div>

          {/* Divider + sign up */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(231,236,239,0.07)',
              textAlign: 'center',
            }}
          >
            <span style={{ color: '#6E7F86', fontSize: '13px' }}>
              Don&apos;t have an account?{' '}
            </span>
            <a
              href="/signup"
              style={{
                color: '#E7ECEF',
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Create account
            </a>
          </div>

        </div>
      </div>
    </>
  )
}
