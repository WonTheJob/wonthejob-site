import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  solo:  process.env.STRIPE_SOLO_PRICE_ID,
  pro:   process.env.STRIPE_PRO_PRICE_ID,
  storm: process.env.STRIPE_STORM_PRICE_ID,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { plan, email } = req.body;
  const priceId = PLANS[plan];
  if (!priceId) return res.status(400).json({ error: 'Invalid plan' });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?welcome=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    metadata: { plan },
  });

  res.json({ url: session.url });
}
