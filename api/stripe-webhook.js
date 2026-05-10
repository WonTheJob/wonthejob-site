import Stripe from 'stripe';
import { buffer } from 'micro';
export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf, sig, process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { customer_email, metadata } = session;
    console.log('New subscriber:', customer_email, metadata.plan);
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    console.log('Cancelled:', sub.customer);
  }

  res.json({ received: true });
}
