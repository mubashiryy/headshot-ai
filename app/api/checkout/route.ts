import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export async function POST(request: NextRequest) {
  try {
    const { predictionId, priceType } = await request.json();

    if (!predictionId || !priceType) {
      return NextResponse.json(
        { error: 'Missing predictionId or priceType' },
        { status: 400 }
      );
    }

    if (!['one_time', 'subscription'].includes(priceType)) {
      return NextResponse.json({ error: 'Invalid priceType' }, { status: 400 });
    }

    const isSubscription = priceType === 'subscription';
    const priceId = isSubscription
      ? process.env.STRIPE_PRICE_SUBSCRIPTION!
      : process.env.STRIPE_PRICE_ONE_TIME!;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?canceled=1`,
      metadata: {
        prediction_id: predictionId,
        price_type: priceType,
      },
      ...(isSubscription && {
        subscription_data: {
          metadata: { prediction_id: predictionId },
        },
      }),
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error('[checkout] Error:', err);
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
