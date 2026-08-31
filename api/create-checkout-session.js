// api/create-checkout-session.js
// Vercel / Netlify serverless function
// POST /api/create-checkout-session
// Body: { priceId, mode, successUrl, cancelUrl }
// Cookie: rogue_ref (affiliate code, optional)
// Returns: { url } — Stripe Checkout session URL

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.DOMAIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, mode, successUrl, cancelUrl } = req.body;

  if (!priceId || !mode || !successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  if (!['payment', 'subscription'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode' });
  }

  // Read affiliate code from cookie
  const cookieHeader = req.headers.cookie || '';
  const affiliateMatch = cookieHeader.match(/rogue_ref=([^;]+)/);
  const affiliateId = affiliateMatch ? decodeURIComponent(affiliateMatch[1]) : null;

  const sessionParams = {
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    metadata: {
      source: 'groupe-rogue-website',
      ...(affiliateId && { affiliate_id: affiliateId }),
    },
    payment_method_types: ['card'],
  };

  if (mode === 'subscription') {
    sessionParams.subscription_data = {
      metadata: {
        source: 'groupe-rogue-website',
        ...(affiliateId && { affiliate_id: affiliateId }),
      },
    };
  }

  // Locale: detect from Accept-Language header
  const acceptLang = req.headers['accept-language'] || '';
  sessionParams.locale = acceptLang.startsWith('fr') ? 'fr' : 'en';

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe session creation error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
};
