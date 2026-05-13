import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

const DARK = '#13322A'
const CREAM = '#F5F1E6'
const SAGE = '#808C70'
const SAGE_LT = '#EEF0E8'
const MUTED = '#5C6B63'
const LIGHT = '#F7F5EF'
const WHITE = '#FFFFFF'

const styles = StyleSheet.create({
  page: {
    backgroundColor: WHITE,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: DARK,
    padding: 0,
  },
  // Cover page
  cover: {
    backgroundColor: DARK,
    flex: 1,
    padding: 48,
    justifyContent: 'space-between',
  },
  coverTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  coverLogoBox: {
    width: 120,
    height: 40,
    backgroundColor: CREAM,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverLogoText: {
    color: DARK,
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 3,
  },
  coverSponsorBox: {
    alignItems: 'flex-end',
  },
  coverSponsorLabel: {
    color: SAGE,
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  coverSponsorName: {
    color: CREAM,
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  coverMid: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  coverTitle: {
    color: CREAM,
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
    lineHeight: 1.2,
  },
  coverSubtitle: {
    color: SAGE,
    fontSize: 13,
    marginBottom: 8,
  },
  coverMeta: {
    color: MUTED,
    fontSize: 10,
  },
  coverScore: {
    backgroundColor: SAGE,
    borderRadius: 8,
    padding: 20,
    alignSelf: 'flex-start',
    alignItems: 'center',
    marginTop: 32,
  },
  coverScoreNum: {
    color: WHITE,
    fontSize: 40,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1,
  },
  coverScoreLabel: {
    color: WHITE,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  coverBottom: {
    borderTopWidth: 1,
    borderTopColor: '#1D4A38',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coverBottomText: {
    color: MUTED,
    fontSize: 9,
  },
  // Content pages
  contentPage: {
    padding: 48,
    flex: 1,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: SAGE_LT,
  },
  pageHeaderLeft: {
    flexDirection: 'column',
  },
  pageHeaderTitle: {
    color: DARK,
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  pageHeaderSub: {
    color: MUTED,
    fontSize: 8,
    marginTop: 2,
  },
  pageHeaderRight: {
    color: SAGE,
    fontSize: 8,
    letterSpacing: 1,
  },
  // Section headings
  sectionTitle: {
    color: DARK,
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitleFirst: {
    color: DARK,
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 16,
    marginTop: 0,
  },
  // Summary stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: SAGE_LT,
    borderRadius: 6,
    padding: 16,
    alignItems: 'center',
  },
  statNum: {
    color: DARK,
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1,
  },
  statLabel: {
    color: MUTED,
    fontSize: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
    textAlign: 'center',
  },
  // Obligation cards
  obligationCard: {
    backgroundColor: LIGHT,
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
  },
  obligationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  obligationTitle: {
    color: DARK,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    flex: 1,
    marginRight: 8,
  },
  obligationBadge: {
    backgroundColor: SAGE,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  obligationBadgeText: {
    color: WHITE,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  obligationMeta: {
    color: MUTED,
    fontSize: 8,
    marginBottom: 10,
  },
  proofPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 4,
    objectFit: 'cover',
    marginTop: 8,
  },
  proofNote: {
    backgroundColor: WHITE,
    borderRadius: 4,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: SAGE,
  },
  proofNoteText: {
    color: DARK,
    fontSize: 9,
    lineHeight: 1.4,
  },
  // Footer
  pageFooter: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: SAGE_LT,
  },
  footerText: {
    color: MUTED,
    fontSize: 7,
  },
  footerBrand: {
    color: SAGE,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },
})

type Proof = {
  id: string
  photo_url: string | null
  external_link: string | null
  note: string | null
  captured_at: string
  geo_lat: number | null
  geo_lng: number | null
}

type Obligation = {
  id: string
  description: string | null
  proof_type: string
  status: string
  proofs: Proof[]
}

type ProofPackData = {
  clubName: string
  sponsorName: string
  contractTitle: string
  season: string
  generatedAt: string
  obligations: Obligation[]
  deliveryScore: number
  narrative?: string
}

function PageHeader({ clubName, sponsorName }: { clubName: string; sponsorName: string }) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.pageHeaderLeft}>
        <Text style={styles.pageHeaderTitle}>{clubName}</Text>
        <Text style={styles.pageHeaderSub}>Proof of delivery report</Text>
      </View>
      <Text style={styles.pageHeaderRight}>{sponsorName}</Text>
    </View>
  )
}

function PageFooter({ page, total, docRef }: { page: number; total: number; docRef: string }) {
  return (
    <View style={styles.pageFooter} fixed>
      <Text style={styles.footerText}>Page {page} of {total} · Ref: {docRef}</Text>
      <Text style={styles.footerBrand}>Generated by Sporr · sporr.io</Text>
    </View>
  )
}

export function ProofPackDocument({ data }: { data: ProofPackData }) {
  const delivered = data.obligations.filter(o => o.status === 'delivered')
  const pending = data.obligations.filter(o => o.status === 'pending')
  const skipped = data.obligations.filter(o => o.status === 'not_applicable')
  const docRef = `SPR-${Date.now().toString(36).toUpperCase()}`
  const dateStr = new Date(data.generatedAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <Document
      title={`Proof Pack — ${data.sponsorName} — ${data.season}`}
      author="Sporr"
      subject="Sponsorship proof of delivery"
    >
      {/* COVER PAGE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          <View style={styles.coverTop}>
            <View style={styles.coverLogoBox}>
              <Text style={styles.coverLogoText}>SPORR</Text>
            </View>
            <View style={styles.coverSponsorBox}>
              <Text style={styles.coverSponsorLabel}>Prepared for</Text>
              <Text style={styles.coverSponsorName}>{data.sponsorName}</Text>
            </View>
          </View>

          <View style={styles.coverMid}>
            <Text style={styles.coverTitle}>{data.contractTitle}</Text>
            <Text style={styles.coverSubtitle}>{data.clubName}</Text>
            <Text style={styles.coverMeta}>{data.season} · Generated {dateStr}</Text>

            <View style={styles.coverScore}>
              <Text style={styles.coverScoreNum}>{data.deliveryScore}%</Text>
              <Text style={styles.coverScoreLabel}>Delivery score</Text>
            </View>
          </View>

          <View style={styles.coverBottom}>
            <Text style={styles.coverBottomText}>
              {delivered.length} of {data.obligations.length} obligations delivered
            </Text>
            <Text style={styles.coverBottomText}>
              Ref: {docRef} · sporr.io
            </Text>
          </View>
        </View>
      </Page>

      {/* SUMMARY PAGE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.contentPage}>
          <PageHeader clubName={data.clubName} sponsorName={data.sponsorName} />

          <Text style={styles.sectionTitleFirst}>Season summary</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{data.obligations.length}</Text>
              <Text style={styles.statLabel}>Total obligations</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{delivered.length}</Text>
              <Text style={styles.statLabel}>Delivered</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{data.deliveryScore}%</Text>
              <Text style={styles.statLabel}>Delivery score</Text>
            </View>
            {skipped.length > 0 && (
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{skipped.length}</Text>
                <Text style={styles.statLabel}>Not applicable</Text>
              </View>
            )}
          </View>

          {data.narrative && (
            <>
              <Text style={styles.sectionTitle}>Partnership summary</Text>
              <View style={styles.proofNote}>
                <Text style={styles.proofNoteText}>{data.narrative}</Text>
              </View>
            </>
          )}

          {pending.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Outstanding obligations</Text>
              {pending.map(ob => (
                <View key={ob.id} style={[styles.obligationCard, { backgroundColor: '#FFF8F0' }]}>
                  <Text style={styles.obligationTitle}>{ob.description || 'Obligation'}</Text>
                  <Text style={styles.obligationMeta}>
                    Proof type: {ob.proof_type} · Status: pending
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
        <PageFooter page={2} total={2 + Math.ceil(delivered.length / 3)} docRef={docRef} />
      </Page>

      {/* OBLIGATION DETAIL PAGES — group 3 per page */}
      {delivered.length > 0 && chunk(delivered, 3).map((group, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          <View style={styles.contentPage}>
            <PageHeader clubName={data.clubName} sponsorName={data.sponsorName} />
            <Text style={styles.sectionTitleFirst}>
              Proof of delivery {pageIdx === 0 ? '' : `(continued)`}
            </Text>

            {group.map(ob => (
              <View key={ob.id} style={styles.obligationCard}>
                <View style={styles.obligationHeader}>
                  <Text style={styles.obligationTitle}>
                    {ob.description || 'Obligation'}
                  </Text>
                  <View style={styles.obligationBadge}>
                    <Text style={styles.obligationBadgeText}>Delivered</Text>
                  </View>
                </View>

                {ob.proofs.length > 0 && ob.proofs[0].captured_at && (
                  <Text style={styles.obligationMeta}>
                    Captured: {new Date(ob.proofs[0].captured_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                    {ob.proofs[0].geo_lat && ` · ${ob.proofs[0].geo_lat.toFixed(4)}°N ${Math.abs(ob.proofs[0].geo_lng || 0).toFixed(4)}°E`}
                  </Text>
                )}

                {ob.proofs[0]?.photo_url && (
                  <Image src={ob.proofs[0].photo_url} style={styles.proofPhoto} />
                )}

                {ob.proofs[0]?.note && (
                  <View style={styles.proofNote}>
                    <Text style={styles.proofNoteText}>{ob.proofs[0].note}</Text>
                  </View>
                )}

                {ob.proofs[0]?.external_link && (
                  <View style={styles.proofNote}>
                    <Text style={styles.proofNoteText}>
                      Link: {ob.proofs[0].external_link}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
          <PageFooter page={3 + pageIdx} total={2 + Math.ceil(delivered.length / 3)} docRef={docRef} />
        </Page>
      ))}
    </Document>
  )
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}
