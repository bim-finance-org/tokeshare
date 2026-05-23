import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Tokeshare — Redefining access to investment';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #b58a3c 100%)',
          padding: '80px',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 32, opacity: 0.8, marginBottom: 24 }}>tokeshare.io</div>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
          Redefining access to investment
        </div>
        <div style={{ fontSize: 28, opacity: 0.85, marginTop: 32, maxWidth: 900 }}>
          Tokenized real estate, commodities and ETFs on Polygon &amp; Base.
        </div>
      </div>
    ),
    size,
  );
}
