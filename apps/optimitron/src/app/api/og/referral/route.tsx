import { ImageResponse } from '@vercel/og'
import {
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
} from "@optimitron/data/parameters"

export const runtime = 'edge'

const LIVES_PER_VOTE = VOTER_LIVES_SAVED.value
const SUFFERING_YEARS_PER_VOTE = Math.round(VOTER_SUFFERING_HOURS_PREVENTED.value / 8_760) // hours → years

export async function GET() {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFF',
            padding: '80px',
            position: 'relative',
          }}
        >
          {/* Neobrutalist border */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              left: '40px',
              right: '40px',
              bottom: '40px',
              border: '8px solid #000',
              display: 'flex',
            }}
          />

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '60px',
              zIndex: 1,
            }}
          >
            {/* Emoji row */}
            <div
              style={{
                fontSize: '100px',
                marginBottom: '40px',
                display: 'flex',
                gap: '20px',
              }}
            >
              <div style={{ display: 'flex' }}>🌍</div>
              <div style={{ display: 'flex' }}>⚡</div>
              <div style={{ display: 'flex' }}>❤️</div>
            </div>

            {/* Main headline */}
            <div
              style={{
                fontSize: '64px',
                fontWeight: 900,
                lineHeight: 1.1,
                marginBottom: '30px',
                textTransform: 'uppercase',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex' }}>Save {LIVES_PER_VOTE.toFixed(1)} Lives</div>
              <div style={{ display: 'flex' }}>and Prevent {SUFFERING_YEARS_PER_VOTE} Years</div>
              <div style={{ display: 'flex' }}>of Suffering</div>
            </div>

            {/* Time badge */}
            <div
              style={{
                backgroundColor: '#FF6B9D',
                border: '6px solid #000',
                padding: '20px 50px',
                fontSize: '48px',
                fontWeight: 900,
                textTransform: 'uppercase',
                boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
                display: 'flex',
                marginBottom: '30px',
              }}
            >
              in 30 Seconds
            </div>

            {/* Subheadline */}
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#666',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
              }}
            >
              <div style={{ display: 'flex' }}>Vote for the 1% Treaty referendum</div>
              <div style={{ display: 'flex' }}>to optimize global governance</div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    )
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    console.error(e)
    return new Response(`Failed to generate OG image: ${message}`, {
      status: 500,
    })
  }
}
