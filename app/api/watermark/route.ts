import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Allowed Replicate domains
const ALLOWED_HOSTS = [
  'replicate.delivery',
  'pbxt.replicate.delivery',
  'api.replicate.com',
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

const WATERMARK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" fill="rgba(0,0,0,0)" />
  <g transform="rotate(-35, 256, 256)">
    <text x="256" y="230" font-family="Arial, sans-serif" font-size="38" font-weight="bold"
          fill="rgba(255,255,255,0.62)" text-anchor="middle" dominant-baseline="middle">
      HeadshotAI
    </text>
    <text x="256" y="278" font-family="Arial, sans-serif" font-size="22"
          fill="rgba(255,255,255,0.55)" text-anchor="middle" dominant-baseline="middle">
      FREE PREVIEW
    </text>
    <line x1="100" y1="253" x2="412" y2="253" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
  </g>
  <g transform="rotate(-35, 256, 256) translate(0, 140)">
    <text x="256" y="230" font-family="Arial, sans-serif" font-size="18"
          fill="rgba(255,255,255,0.35)" text-anchor="middle" dominant-baseline="middle">
      headshotai.app
    </text>
  </g>
</svg>
`;

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  if (!isAllowedUrl(url)) {
    return new NextResponse('Disallowed image source', { status: 403 });
  }

  try {
    // Fetch the original image from Replicate
    const imageRes = await fetch(url, {
      headers: { 'User-Agent': 'HeadshotAI/1.0' },
    });

    if (!imageRes.ok) {
      return new NextResponse('Failed to fetch source image', { status: 502 });
    }

    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    // Resize to 640×640 for free preview, composite watermark
    const watermarked = await sharp(imageBuffer)
      .resize(640, 640, { fit: 'cover', position: 'center' })
      .composite([
        {
          input: Buffer.from(WATERMARK_SVG),
          gravity: 'center',
          blend: 'over',
        },
      ])
      .jpeg({ quality: 78, progressive: true })
      .toBuffer();

    return new NextResponse(watermarked, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, immutable',
        'X-Watermarked': '1',
      },
    });
  } catch (err) {
    console.error('[watermark] Error:', err);
    return new NextResponse('Image processing failed', { status: 500 });
  }
}
