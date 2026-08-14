import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// App Router reads the raw body via request.text() — no special config needed
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return new NextResponse('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  // ─── Handle events ─────────────────────────────────────────────────────────
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(
        `[webhook] Payment complete — prediction_id=${session.metadata?.prediction_id}, mode=${session.mode}`
      );
      // TODO (production): persist to DB, email the user their download link, etc.
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      console.log(`[webhook] Subscription cancelled — id=${sub.id}`);
      // TODO (production): revoke access in your DB
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[webhook] Payment failed — customer=${invoice.customer}`);
      // TODO (production): notify the user
      break;
    }

    default:
      // Silently ignore unhandled event types
      break;
  }

  return NextResponse.json({ received: true });
}
