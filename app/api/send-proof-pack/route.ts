import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sponsorEmail,
      sponsorName,
      clubName,
      contractTitle,
      season,
      narrative,
      obligations,
    } = body

    if (!sponsorEmail) {
      return NextResponse.json({ error: 'No sponsor email provided' }, { status: 400 })
    }

    const delivered = obligations.filter((o: any) => o.status === 'delivered')
    const deliveryScore = obligations.length > 0
      ? Math.round((delivered.length / obligations.length) * 100)
      : 0

    const viewToken = Buffer.from(`${contractTitle}-${Date.now()}`).toString('base64url')

    const obligationRows = obligations.map((ob: any) => `
      <tr style="border-bottom: 1px solid #EEF0E8;">
        <td style="padding: 12px 16px; color: #111814; font-size: 14px;">${ob.description || 'Obligation'}</td>
        <td style="padding: 12px 16px; text-align: right;">
          <span style="
            background: ${ob.status === 'delivered' ? '#13322A' : ob.status === 'not_applicable' ? '#EEF0E8' : '#FEF3C7'};
            color: ${ob.status === 'delivered' ? '#F5F1E6' : ob.status === 'not_applicable' ? '#5C6B63' : '#92400E'};
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          ">
            ${ob.status === 'delivered' ? '✓ Delivered' : ob.status === 'not_applicable' ? 'N/A' : 'Pending'}
          </span>
        </td>
      </tr>
    `).join('')

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Proof of Delivery — ${clubName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F5EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F5EF; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background-color: #13322A; padding: 32px 40px; border-radius: 12px 12px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="color: #F5F1E6; font-size: 20px; font-weight: 700; letter-spacing: 4px;">SPORR</span>
                  </td>
                  <td align="right">
                    <span style="color: #808C70; font-size: 12px;">Proof of delivery</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background-color: #1D4A38; padding: 32px 40px;">
              <p style="color: #808C70; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 8px;">Prepared for</p>
              <h1 style="color: #F5F1E6; font-size: 24px; font-weight: 700; margin: 0 0 4px;">${sponsorName}</h1>
              <p style="color: #808C70; font-size: 14px; margin: 0;">${contractTitle} · ${season}</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td style="background-color: rgba(255,255,255,0.1); border-radius: 8px; padding: 20px; text-align: center; width: 33%;">
                    <p style="color: #F5F1E6; font-size: 32px; font-weight: 700; margin: 0;">${obligations.length}</p>
                    <p style="color: #808C70; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; margin: 4px 0 0;">Total</p>
                  </td>
                  <td width="8"></td>
                  <td style="background-color: rgba(255,255,255,0.1); border-radius: 8px; padding: 20px; text-align: center; width: 33%;">
                    <p style="color: #F5F1E6; font-size: 32px; font-weight: 700; margin: 0;">${delivered.length}</p>
                    <p style="color: #808C70; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; margin: 4px 0 0;">Delivered</p>
                  </td>
                  <td width="8"></td>
                  <td style="background-color: rgba(128,140,112,0.3); border-radius: 8px; padding: 20px; text-align: center; width: 33%;">
                    <p style="color: #F5F1E6; font-size: 32px; font-weight: 700; margin: 0;">${deliveryScore}%</p>
                    <p style="color: #808C70; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; margin: 4px 0 0;">Score</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 32px 40px;">

              <p style="color: #2D3830; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                Dear ${sponsorName} team,
              </p>

              <p style="color: #2D3830; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                Please find below our proof of delivery report for the <strong>${contractTitle}</strong> partnership. 
                This report has been automatically generated by Sporr and contains timestamped, 
                geo-tagged evidence of every obligation delivered on your behalf.
              </p>

              ${narrative ? `
              <div style="background-color: #F7F5EF; border-left: 4px solid #808C70; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 0 0 32px;">
                <p style="color: #2D3830; font-size: 14px; line-height: 1.6; margin: 0; font-style: italic;">${narrative}</p>
              </div>
              ` : ''}

              <h2 style="color: #13322A; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; margin: 0 0 16px;">
                Obligation breakdown
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #EEF0E8; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
                <thead>
                  <tr style="background-color: #13322A;">
                    <th style="padding: 12px 16px; color: #F5F1E6; font-size: 12px; text-align: left; font-weight: 600;">Obligation</th>
                    <th style="padding: 12px 16px; color: #F5F1E6; font-size: 12px; text-align: right; font-weight: 600;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${obligationRows}
                </tbody>
              </table>

              <p style="color: #2D3830; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                ${clubName}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F7F5EF; padding: 24px 40px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="color: #5C6B63; font-size: 12px; margin: 0 0 4px;">
                This report was automatically generated by <strong style="color: #13322A;">Sporr</strong>
              </p>
              <p style="color: #808C70; font-size: 11px; margin: 0;">
                sporr.io · The proof-of-delivery infrastructure for sport and community investment
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `

    const { data, error } = await resend.emails.send({
      from: 'Sporr <noreply@sporr.io>',
      to: [sponsorEmail],
      subject: `Proof of delivery — ${clubName} × ${sponsorName} — ${season}`,
      html: emailHtml,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })

  } catch (err) {
    console.error('Send proof pack error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
