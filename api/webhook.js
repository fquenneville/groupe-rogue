// api/webhook.js
// Vercel / Netlify serverless function
// POST /api/webhook
// Handles Stripe webhook events with signature verification
// Configure in Stripe Dashboard: Webhook endpoint → this URL
// Events to listen for: checkout.session.completed, customer.subscription.deleted, invoice.payment_failed

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Kajabi API helpers
async function kajabiRequest(method, path, body) {
  const res = await fetch(`https://app.kajabi.com/api/v1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.KAJABI_API_KEY}`,
      'X-Kajabi-Site-ID': process.env.KAJABI_SITE_ID,
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kajabi ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json().catch(() => null);
}

async function activateKajabiOffer(email, offerCode, tags) {
  // Grant offer access
  await kajabiRequest('POST', '/offers/grants', {
    email,
    offer_code: offerCode,
    tags: tags || [],
  });
}

async function deactivateKajabiAccess(email, offerCode) {
  // Revoke offer access — Kajabi API: DELETE grant by email + offer
  await kajabiRequest('POST', '/offers/revoke', {
    email,
    offer_code: offerCode,
  });
}

// Map Stripe price IDs to Kajabi offer codes and tags
const PRICE_TO_KAJABI = {
  [process.env.STRIPE_PRICE_CELLULE_MONTHLY]: {
    offer_code: process.env.KAJABI_OFFER_CELLULE,
    tags: ['membre', 'cellule', 'mensuel'],
  },
  [process.env.STRIPE_PRICE_CELLULE_ANNUAL]: {
    offer_code: process.env.KAJABI_OFFER_CELLULE,
    tags: ['membre', 'cellule', 'annuel'],
  },
  [process.env.STRIPE_PRICE_GUILDE_MONTHLY]: {
    offer_code: process.env.KAJABI_OFFER_GUILDE,
    tags: ['membre', 'guilde', 'mensuel'],
  },
  [process.env.STRIPE_PRICE_GUILDE_ANNUAL]: {
    offer_code: process.env.KAJABI_OFFER_GUILDE,
    tags: ['membre', 'guilde', 'annuel'],
  },
  [process.env.STRIPE_PRICE_SANCTUAIRE]: {
    offer_code: process.env.KAJABI_OFFER_SANCTUAIRE,
    tags: ['membre', 'sanctuaire'],
  },
  [process.env.STRIPE_PRICE_RF_STRUC_01]: {
    offer_code: process.env.KAJABI_OFFER_RF_STRUC_01,
    tags: ['rogue-file', 'structures'],
  },
  [process.env.STRIPE_PRICE_RF_TRAJ_02]: {
    offer_code: process.env.KAJABI_OFFER_RF_TRAJ_02,
    tags: ['rogue-file', 'trajectoires'],
  },
  [process.env.STRIPE_PRICE_RF_ECO_01]: {
    offer_code: process.env.KAJABI_OFFER_RF_ECO_01,
    tags: ['rogue-file', 'ecosystemes'],
  },
  [process.env.STRIPE_PRICE_RF_FUTU_01]: {
    offer_code: process.env.KAJABI_OFFER_RF_FUTU_01,
    tags: ['rogue-file', 'futurs'],
  },
};

// Raw body required for Stripe signature verification
// On Vercel: set bodyParser: false in config export
// On Netlify: raw body is available via req.body as Buffer if Content-Type is not parsed
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end('Method not allowed');
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).send('Missing Stripe-Signature header');
  }

  let event;
  try {
    // req.body must be the raw Buffer — configure your framework accordingly
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        // Only process paid sessions
        if (session.payment_status !== 'paid') break;

        const email = session.customer_details?.email;
        if (!email) {
          console.warn('checkout.session.completed: no email in session', session.id);
          break;
        }

        // Retrieve line items to get the price ID
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
        const priceId = lineItems.data[0]?.price?.id;

        const kajabi = PRICE_TO_KAJABI[priceId];
        if (!kajabi) {
          console.warn('No Kajabi mapping for price ID:', priceId);
          break;
        }

        await activateKajabiOffer(email, kajabi.offer_code, kajabi.tags);
        console.log(`Kajabi access granted: ${email} → ${kajabi.offer_code}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Retrieve customer email
        const customer = await stripe.customers.retrieve(customerId);
        const email = customer.email;
        if (!email) {
          console.warn('customer.subscription.deleted: no email for customer', customerId);
          break;
        }

        const priceId = subscription.items?.data[0]?.price?.id;
        const kajabi = PRICE_TO_KAJABI[priceId];
        if (!kajabi) {
          console.warn('No Kajabi mapping for price ID:', priceId);
          break;
        }

        await deactivateKajabiAccess(email, kajabi.offer_code);
        console.log(`Kajabi access revoked: ${email} → ${kajabi.offer_code}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Retrieve customer email for grace period notification
        const customer = await stripe.customers.retrieve(customerId);
        const email = customer.email;
        if (!email) {
          console.warn('invoice.payment_failed: no email for customer', customerId);
          break;
        }

        // Trigger grace period email via Zapier
        if (process.env.ZAPIER_WEBHOOK_URL) {
          await fetch(process.env.ZAPIER_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              _event: 'payment_failed',
              email,
              invoice_id: invoice.id,
              amount_due: invoice.amount_due,
              currency: invoice.currency,
              attempt_count: invoice.attempt_count,
              next_payment_attempt: invoice.next_payment_attempt,
            }),
          });
          console.log(`Grace period email triggered for: ${email}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error handling event ${event.type}:`, err.message);
    // Return 200 to acknowledge receipt and prevent Stripe retries for processing errors
    // (signature verification failures above still return 400)
    return res.status(200).json({ received: true, warning: err.message });
  }

  return res.status(200).json({ received: true });
};

// Vercel config: disable body parser to get raw body for signature verification
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
