/* eslint-env node */
/* global process */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Client, Databases, Permission, Role } from 'node-appwrite';
import { Buffer } from 'buffer';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  PORT = 8787,
  // Appwrite admin envs (preferred names)
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID,
  APPWRITE_BOOKINGS_COLLECTION_ID,
  APPWRITE_PAYMENTS_COLLECTION_ID,
  APPWRITE_BUCKET_ID,
  // Fallback to frontend-style names if provided
  VITE_API_ENDPOINT,
  VITE_PROJECT_ID,
  VITE_DATABASE_ID,
  VITE_BOOKINGS_COLLECTION_ID,
  VITE_PAYMENTS_COLLECTION_ID,
  VITE_BUCKET_ID,
  // Optional server-only API key name
  SERVER_APPWRITE_API_KEY,
  // Optional: comma-separated list of allowed origins for media proxy (e.g. https://darshan360.netlify.app,http://localhost:5173)
  SERVER_ALLOWED_ORIGINS,
} = process.env;

const AW_ENDPOINT = APPWRITE_ENDPOINT || VITE_API_ENDPOINT;
const AW_PROJECT = APPWRITE_PROJECT_ID || VITE_PROJECT_ID;
const AW_API_KEY = APPWRITE_API_KEY || SERVER_APPWRITE_API_KEY;
const AW_DB_ID = APPWRITE_DATABASE_ID || VITE_DATABASE_ID;
const AW_BOOKINGS_ID = APPWRITE_BOOKINGS_COLLECTION_ID || VITE_BOOKINGS_COLLECTION_ID;
const AW_PAYMENTS_ID = APPWRITE_PAYMENTS_COLLECTION_ID || VITE_PAYMENTS_COLLECTION_ID;
const AW_BUCKET = APPWRITE_BUCKET_ID || VITE_BUCKET_ID;
// Parse allowed origins from env into an array
const ALLOWED_ORIGINS = (SERVER_ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn('Warning: RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET not set. Set them in server/.env');
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

let databases = null;
if (AW_ENDPOINT && AW_PROJECT && AW_API_KEY) {
  try {
    const client = new Client()
  .setEndpoint(AW_ENDPOINT)
  .setProject(AW_PROJECT)
  .setKey(AW_API_KEY);
    databases = new Databases(client);
  } catch (e) {
    console.warn('Warning: Failed to init Appwrite admin client:', e?.message);
  }
} else {
  console.warn('Info: Appwrite admin env not fully set; bookings will not be recorded server-side.');
}

app.get('/', (req, res) => res.json({ ok: true }));

// Helper: create or update a booking doc keyed by Razorpay orderId
async function createOrUpdateBooking({ orderId, trip, userId, status }) {
  if (!databases || !AW_DB_ID || !AW_BOOKINGS_ID) return null;
  const tripId = trip?.id || trip?.$id || trip?.tripId;
  const tripTitle = trip?.title || trip?.tripTitle || 'Trip';
  const now = new Date().toISOString();
  try {
    // Try update first (in case doc already exists)
    try {
      const updated = await databases.updateDocument(
        AW_DB_ID,
        AW_BOOKINGS_ID,
        orderId,
        { tripId, tripTitle, userId, status, date: now }
      );
      return updated;
  } catch {
      // Fall back to create with same id and set user read permission
      const permissions = [Permission.read(Role.user(userId))];
      const created = await databases.createDocument(
        AW_DB_ID,
        AW_BOOKINGS_ID,
        orderId,
        { tripId, tripTitle, userId, status, date: now },
        permissions
      );
      return created;
    }
  } catch (err) {
    console.error('Failed creating booking:', err?.message);
    return null;
  }
}

// Helper: create or update a payment doc keyed by Razorpay orderId
async function createOrUpdatePayment({ orderId, trip, userId, status, amount, currency, paymentId = null, signature = null, failure = null }) {
  if (!databases || !AW_DB_ID || !AW_PAYMENTS_ID) return null;
  const tripId = trip?.id || trip?.$id || trip?.tripId;
  const tripTitle = trip?.title || trip?.tripTitle || 'Trip';
  const now = new Date().toISOString();
  const data = { orderId, paymentId, tripId, tripTitle, userId, status, amount, currency, date: now, signature, failure };
  try {
    try {
      const updated = await databases.updateDocument(AW_DB_ID, AW_PAYMENTS_ID, orderId, data);
      return updated;
    } catch {
      const permissions = [Permission.read(Role.user(userId))];
      const created = await databases.createDocument(AW_DB_ID, AW_PAYMENTS_ID, orderId, data, permissions);
      return created;
    }
  } catch (err) {
    console.error('Failed creating/updating payment:', err?.message);
    return null;
  }
}

// Create order
app.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, trip, userId } = req.body || {};
    if (!amount) return res.status(400).json({ error: 'amount required' });
    const order = await razorpay.orders.create({ amount, currency, receipt });
    // Record a pending booking tied to this order id (if admin configured)
    let recorded = false;
    let paymentsRecorded = false;
    if (trip && userId) {
      const b = await createOrUpdateBooking({ orderId: order.id, trip, userId, status: 'pending' });
      recorded = Boolean(b);
      const p = await createOrUpdatePayment({ orderId: order.id, trip, userId, status: 'created', amount, currency });
      paymentsRecorded = Boolean(p);
    }
    res.json({ ...order, serverCreatesBookings: recorded, serverCreatesPayments: paymentsRecorded });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Verify payment and optionally record booking (client already sends trip, userId)
app.post('/verify-payment', async (req, res) => {
  try {
    const { order, razorpay: rp, trip, userId } = req.body || {};
    if (!order?.id || !rp?.razorpay_payment_id || !rp?.razorpay_signature) {
      return res.status(400).json({ error: 'invalid payload' });
    }
    const body = `${order.id}|${rp.razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const valid = expectedSignature === rp.razorpay_signature;
    if (!valid) return res.status(400).json({ error: 'invalid signature' });

  // Update booking to paid
  const booking = await createOrUpdateBooking({ orderId: order.id, trip, userId, status: 'paid' });
  const payment = await createOrUpdatePayment({ orderId: order.id, trip, userId, status: 'paid', amount: order.amount, currency: order.currency, paymentId: rp.razorpay_payment_id, signature: rp.razorpay_signature });
  res.json({ ok: true, bookingId: booking?.$id || order.id, recorded: Boolean(booking), paymentId: payment?.$id || order.id, paymentsRecorded: Boolean(payment) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Record a failed payment attempt as a booking with status 'failed'
app.post('/record-payment-failure', async (req, res) => {
  try {
  const { order, trip, userId } = req.body || {};
    if (!order?.id || !trip || !userId) {
      return res.status(400).json({ error: 'invalid payload' });
    }
  const booking = await createOrUpdateBooking({ orderId: order.id, trip, userId, status: 'failed' });
  const payment = await createOrUpdatePayment({ orderId: order.id, trip, userId, status: 'failed', failure: req.body?.failure || null });
  res.json({ ok: true, bookingId: booking?.$id || order.id, recorded: Boolean(booking), paymentId: payment?.$id || order.id, paymentsRecorded: Boolean(payment) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// Media proxy: stream files from Appwrite storage using server admin key to avoid CORS/private-bucket issues.
app.get('/media/:fileId', async (req, res) => {
  try {
    // Enforce allowed origins if configured. Use Origin header first, then Referer as fallback.
    if (ALLOWED_ORIGINS.length > 0) {
      const originHeader = req.get('origin');
      const referer = req.get('referer');
      // Normalize referer to origin (protocol + host + port)
      const refererOrigin = (referer && (() => { try { const u = new URL(referer); return u.origin; } catch { return null; } })());
      const requestOrigin = originHeader || refererOrigin || null;
      if (!requestOrigin || !ALLOWED_ORIGINS.includes(requestOrigin)) {
        return res.status(403).send('Forbidden: origin not allowed');
      }
    }
    const fileId = req.params.fileId;
    const bucketId = AW_BUCKET;
    if (!bucketId) return res.status(400).send('Bucket ID not configured on server');

    const base = (AW_ENDPOINT || '').replace(/\/$/, '');
    const project = AW_PROJECT;
    const apiKey = AW_API_KEY;

    if (!base || !project || !apiKey) {
      return res.status(500).send('Server Appwrite env not configured (endpoint/project/key)');
    }

    const url = `${base}/storage/buckets/${bucketId}/files/${fileId}/view?project=${project}`;

    // Use global fetch (Node 18+) to request the file with admin key
    const upstream = await fetch(url, {
      headers: {
        'X-Appwrite-Project': project,
        'X-Appwrite-Key': apiKey,
      },
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return res.status(upstream.status).send(text || `Upstream error ${upstream.status}`);
    }

    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);
    // Forward cache-control if present
    const cache = upstream.headers.get('cache-control');
    if (cache) res.setHeader('cache-control', cache);

    // Pipe the response body to client
    const reader = upstream.body.getReader();
    // Convert readable stream to Node stream
    const { Readable } = await import('stream');
    const stream = new Readable({ read() {} });
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Use Buffer.from to convert Uint8Array chunk to Buffer
          stream.push(Buffer.from(value));
        }
        stream.push(null);
      } catch (err) {
        stream.destroy(err);
      }
    })();
    stream.pipe(res);
  } catch (err) {
    console.error('media proxy error', err);
    res.status(500).send('Failed to proxy media');
  }
});
