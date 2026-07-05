// ── Provider-agnostic capture-link sender ─────────────────────────────────────
// v1 ships DARK: the default provider logs and no-ops. Going live later is a
// config change (TD_SMS_PROVIDER + provider credentials), NOT a code change.
//
// The link ALWAYS lives on www.sporr.no — never a shortener, never a Vercel URL —
// because the Norwegian trusted-sender path requires an operator-whitelisted
// domain behind a registered sender ID via a domestic aggregator (LINK Mobility
// or Strex), which carries a registration lead time. The demo is NOT hostage to
// that: capture is recorded as link_capture whenever the www.sporr.no link is
// used, however it reached the phone (QR, hand-off, paste). Only automated SMS
// delivery is gated on whitelisting.

export type SendResult = { ok: boolean; provider: string; detail?: string }

interface SmsProvider {
  name: string
  send(to: string, message: string): Promise<SendResult>
}

// Default. Records intent, delivers nothing. Safe everywhere, including for
// non-Norwegian testers.
const darkProvider: SmsProvider = {
  name: 'dark',
  async send(to, message) {
    console.log(`[sendCaptureLink:dark] would send to ${to}: ${message}`)
    return { ok: true, provider: 'dark', detail: 'recorded, not delivered (dark mode)' }
  },
}

// Stubs. Wire the real aggregator calls when sender-ID whitelisting clears.
// Deliberately not the default — selecting them requires TD_SMS_PROVIDER to be set.
const linkMobilityProvider: SmsProvider = {
  name: 'link_mobility',
  async send() {
    throw new Error('LINK Mobility provider not implemented — awaiting sender-ID whitelisting')
  },
}
const strexProvider: SmsProvider = {
  name: 'strex',
  async send() {
    throw new Error('Strex provider not implemented — awaiting sender-ID whitelisting')
  },
}

function pickProvider(): SmsProvider {
  switch (process.env.TD_SMS_PROVIDER) {
    case 'link_mobility':
      return linkMobilityProvider
    case 'strex':
      return strexProvider
    default:
      return darkProvider
  }
}

export function captureUrl(token: string) {
  return `https://www.sporr.no/capture/${token}`
}

export async function sendCaptureLink(params: {
  token: string
  toContact: string
  obligationTitle: string
}): Promise<SendResult> {
  const provider = pickProvider()
  const url = captureUrl(params.token)
  const message = `Sporr — capture required: ${params.obligationTitle}. Open ${url}`
  return provider.send(params.toContact, message)
}
