import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const organizationName = searchParams.get('org')

    if (!organizationName) {
      return new Response('Missing organization name', { status: 400 })
    }

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
            {/* Pill emoji */}
            <div
              style={{
                fontSize: '120px',
                marginBottom: '40px',
                display: 'flex',
              }}
            >
              💊
            </div>

            {/* Main text */}
            <div
              style={{
                fontSize: '56px',
                fontWeight: 900,
                lineHeight: 1.2,
                marginBottom: '30px',
                textTransform: 'uppercase',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex' }}>Take the 2-Question</div>
              <div style={{ display: 'flex' }}>Global Clinical Trial</div>
              <div style={{ display: 'flex' }}>Abundance Survey</div>
            </div>

            {/* Organization badge */}
            <div
              style={{
                backgroundColor: '#06B6D4',
                border: '6px solid #000',
                padding: '20px 40px',
                fontSize: '36px',
                fontWeight: 900,
                textTransform: 'uppercase',
                boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
                display: 'flex',
              }}
            >
              Sponsored by {organizationName}
            </div>

            {/* Call to action */}
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                marginTop: '40px',
                color: '#666',
                display: 'flex',
              }}
            >
              Take 30 seconds to make suffering optional
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    )
  } catch (e: any) {
    console.error(e)
    return new Response(`Failed to generate OG image: ${e.message}`, {
      status: 500,
    })
  }
}
