import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import Replicate from 'replicate';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');
  const indexStr = request.nextUrl.searchParams.get('index') || '0';
  const index = Math.max(0, Math.min(3, parseInt(indexStr, 10)));

  if (!sessionId) {
    return new NextResponse('Missing session_id', { status: 400 });
  }

  try {
    // Verify Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const isPaid =
      session.payment_status === 'paid' || session.status === 'complete';

    if (!isPaid) {
      return new NextResponse('Payment required', { status: 403 });
    }

    // Fetch prediction outputs
    const predictionId = session.metadata?.prediction_id;
    if (!predictionId) {
      return new NextResponse('No prediction found', { status: 404 });
    }

    const prediction = await replicate.predictions.get(predictionId);
    const outputs = prediction.output as string[] | null;

    if (!outputs || outputs.length === 0) {
      return new NextResponse('No images available', { status: 404 });
    }

    const imageUrl = outputs[index] ?? outputs[0];

    // Proxy the full-resolution image to the user
    const imageRes = await fetch(imageUrl, {
      headers: { 'User-Agent': 'HeadshotAI/1.0' },
    });

    if (!imageRes.ok) {
      return new NextResponse('Failed to fetch image from provider', { status: 502 });
    }

    const imageBuffer = await imageRes.arrayBuffer();
    const contentType = imageRes.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="headshot-hd-${index + 1}.jpg"`,
        'Cache-Control': 'private, no-store',
        'X-HD-Download': '1',
      },
    });
  } catch (err) {
    console.error('[download] Error:', err);
    return new NextResponse('Download failed', { status: 500 });
  }
}
