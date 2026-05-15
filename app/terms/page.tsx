import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-sporr-cream">
      <nav className="bg-sporr-dark px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <img src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg" alt="Sporr" className="h-20" />
        </Link>
        <Link href="/" className="text-sporr-cream hover:text-sporr-sage text-sm transition-colors">← Back</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-sporr-dark text-3xl font-medium mb-2">Terms of Service</h1>
        <p className="text-sporr-muted text-sm mb-12">Last updated: May 2026</p>

        <div className="prose prose-sm max-w-none space-y-10">

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Who we are</h2>
            <p className="text-sporr-muted leading-relaxed">
              Sporr is a proof-of-delivery platform for sports club sponsorship, operated by Sporr (sporr.io). By creating an account and using Sporr, you agree to these terms. If you do not agree, do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">What Sporr provides</h2>
            <p className="text-sporr-muted leading-relaxed">
              Sporr gives sports clubs tools to document and deliver proof of sponsorship performance — including contract management, obligation tracking, match day proof capture, and Proof Pack generation. We provide the platform; clubs are responsible for the accuracy of the data they enter and the proof they capture.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Your account</h2>
            <p className="text-sporr-muted leading-relaxed mb-3">
              You are responsible for maintaining the security of your account and password. Sporr cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.
            </p>
            <p className="text-sporr-muted leading-relaxed">
              You must be authorised to act on behalf of your club when creating an account. By signing up, you confirm you have that authority.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Acceptable use</h2>
            <p className="text-sporr-muted leading-relaxed mb-3">You agree not to:</p>
            <ul className="text-sporr-muted space-y-2 list-none pl-0">
              {[
                'Use Sporr for any unlawful purpose or in violation of any applicable regulation',
                'Upload false, misleading, or fabricated proof of delivery',
                'Attempt to access data belonging to another organisation',
                'Reverse engineer, copy, or resell any part of the Sporr platform',
                'Use Sporr to send unsolicited communications to sponsors or third parties',
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-sporr-sage flex-shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Subscription and payment</h2>
            <p className="text-sporr-muted leading-relaxed mb-3">
              Sporr is offered on a subscription basis. The free plan is limited to 1 sponsor, 1 contract, and 1 Proof Pack send. Paid plans are billed monthly or annually as agreed at the time of upgrade.
            </p>
            <p className="text-sporr-muted leading-relaxed mb-3">
              Prices are listed in Norwegian Kroner (NOK) and are exclusive of VAT where applicable. Sporr reserves the right to change pricing with 30 days notice to existing subscribers.
            </p>
            <p className="text-sporr-muted leading-relaxed">
              Refunds are not offered for partial months. If you cancel, your plan remains active until the end of the current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Your data</h2>
            <p className="text-sporr-muted leading-relaxed mb-3">
              You own the data you upload to Sporr — sponsor information, contracts, obligations, proof photos, and Proof Packs. We do not sell your data or use it for advertising.
            </p>
            <p className="text-sporr-muted leading-relaxed">
              By uploading content, you grant Sporr a limited licence to store and process that content solely for the purpose of delivering the service to you. This licence ends when you delete your account.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Storage limits</h2>
            <p className="text-sporr-muted leading-relaxed">
              Each plan includes a storage allowance. If you exceed your plan's storage limit, Sporr will notify you and you will need to upgrade or remove data. Sporr reserves the right to suspend uploads (not access) for accounts significantly over their storage limit.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Proof Pack delivery</h2>
            <p className="text-sporr-muted leading-relaxed">
              Sporr provides tools to generate and send Proof Packs to sponsors. Delivery of emails depends on third-party infrastructure and cannot be guaranteed in all cases. Sporr is not liable for failed email delivery due to spam filters, incorrect email addresses, or third-party service outages.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Limitation of liability</h2>
            <p className="text-sporr-muted leading-relaxed">
              Sporr is provided as-is. We do not guarantee uninterrupted or error-free service. To the maximum extent permitted by law, Sporr is not liable for any indirect, incidental, or consequential damages arising from your use of the platform — including loss of sponsorship revenue, reputational damage, or data loss.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Termination</h2>
            <p className="text-sporr-muted leading-relaxed mb-3">
              You may close your account at any time by contacting us at <a href="mailto:privacy@sporr.io" className="text-sporr-dark underline">privacy@sporr.io</a>. We will delete your data within 30 days of a confirmed deletion request.
            </p>
            <p className="text-sporr-muted leading-relaxed">
              Sporr reserves the right to suspend or terminate accounts that violate these terms, with or without notice depending on the severity of the violation.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Changes to these terms</h2>
            <p className="text-sporr-muted leading-relaxed">
              We may update these terms from time to time. We will notify existing users by email at least 14 days before material changes take effect. Continued use of Sporr after that date constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Governing law</h2>
            <p className="text-sporr-muted leading-relaxed">
              These terms are governed by Norwegian law. Any disputes arising from the use of Sporr will be subject to the jurisdiction of Norwegian courts.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Contact</h2>
            <p className="text-sporr-muted leading-relaxed">
              Questions about these terms? Contact us at <a href="mailto:hello@sporr.io" className="text-sporr-dark underline">hello@sporr.io</a>.
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-sporr-sage-lt flex items-center justify-between">
          <p className="text-sporr-muted text-xs">Sporr · sporr.io</p>
          <Link href="/privacy" className="text-sporr-muted text-xs hover:text-sporr-dark transition-colors">Privacy Policy →</Link>
        </div>
      </div>
    </main>
  )
}
