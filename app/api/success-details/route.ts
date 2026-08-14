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

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    // Verify Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const isPaid =
      session.payment_status === 'paid' || session.status === 'complete';

    if (!isPaid) {
      return NextResponse.json({ error: 'Payment not complete' }, { status: 403 });
    }

    const predictionId = session.metadata?.prediction_id;
    const priceType = session.metadata?.price_type || 'one_time';

    if (!predictionId) {
      return NextResponse.json({ error: 'No prediction linked to session' }, { status: 400 });
    }

    // Fetch prediction outputs from Replicate
    const prediction = await replicate.predictions.get(predictionId);

    if (prediction.status !== 'succeeded' || !prediction.output) {
      return NextResponse.json(
        { error: 'Prediction not yet complete', status: prediction.status },
        { status: 202 }
      );
    }

    return NextResponse.json({
      imageUrls: prediction.output as string[],
      priceType,
      sessionId,
    });
  } catch (err: unknown) {
    console.error('[success-details] Error:', err);
    const message = err instanceof Error ? err.message : 'Verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
