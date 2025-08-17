import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Client, Databases, Permission, Role } from 'node-appwrite';

export function getEnv() {
  const env = process.env;
  return {
    RAZORPAY_KEY_ID: env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: env.RAZORPAY_KEY_SECRET,
    // Admin DB envs (support both generic and Vite-style names)
    ENDPOINT: env.APPWRITE_ENDPOINT || env.VITE_API_ENDPOINT,
    PROJECT_ID: env.APPWRITE_PROJECT_ID || env.VITE_PROJECT_ID,
    API_KEY: env.APPWRITE_API_KEY || env.SERVER_APPWRITE_API_KEY,
    DB_ID: env.APPWRITE_DATABASE_ID || env.VITE_DATABASE_ID,
    BOOKINGS_ID: env.APPWRITE_BOOKINGS_COLLECTION_ID || env.VITE_BOOKINGS_COLLECTION_ID,
    PAYMENTS_ID: env.APPWRITE_PAYMENTS_COLLECTION_ID || env.VITE_PAYMENTS_COLLECTION_ID,
  };
}

export function initRazorpay() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = getEnv();
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.warn('Razorpay env not set.');
  }
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
}

export function sign(body) {
  const { RAZORPAY_KEY_SECRET } = getEnv();
  return crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(body.toString()).digest('hex');
}

export function initDb() {
  const { ENDPOINT, PROJECT_ID, API_KEY } = getEnv();
  if (!(ENDPOINT && PROJECT_ID && API_KEY)) return null;
  try {
    const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
    return new Databases(client);
  } catch (e) {
    console.warn('Failed to initialize DB client:', e?.message);
    return null;
  }
}

export async function createOrUpdateBooking(databases, { orderId, trip, userId, status }) {
  const { DB_ID, BOOKINGS_ID } = getEnv();
  if (!databases || !DB_ID || !BOOKINGS_ID) return null;
  const tripId = trip?.id || trip?.$id || trip?.tripId;
  const tripTitle = trip?.title || trip?.tripTitle || 'Trip';
  const now = new Date().toISOString();
  try {
    try {
      return await databases.updateDocument(DB_ID, BOOKINGS_ID, orderId, { tripId, tripTitle, userId, status, date: now });
    } catch (_) {
      const permissions = [Permission.read(Role.user(userId))];
      return await databases.createDocument(DB_ID, BOOKINGS_ID, orderId, { tripId, tripTitle, userId, status, date: now }, permissions);
    }
  } catch (e) {
    console.error('Booking write failed:', e?.message);
    return null;
  }
}

export async function createOrUpdatePayment(databases, { orderId, trip, userId, status, amount, currency, paymentId = null, signature = null, failure = null }) {
  const { DB_ID, PAYMENTS_ID } = getEnv();
  if (!databases || !DB_ID || !PAYMENTS_ID) return null;
  const tripId = trip?.id || trip?.$id || trip?.tripId;
  const tripTitle = trip?.title || trip?.tripTitle || 'Trip';
  const now = new Date().toISOString();
  const data = { orderId, paymentId, tripId, tripTitle, userId, status, amount, currency, date: now, signature, failure };
  try {
    try {
      return await databases.updateDocument(DB_ID, PAYMENTS_ID, orderId, data);
    } catch (_) {
      const permissions = [Permission.read(Role.user(userId))];
      return await databases.createDocument(DB_ID, PAYMENTS_ID, orderId, data, permissions);
    }
  } catch (e) {
    console.error('Payment write failed:', e?.message);
    return null;
  }
}

export function ok(body, init = {}) {
  return json(200, body, init);
}

export function bad(body, init = {}) {
  return json(400, body, init);
}

export function serverError(body, init = {}) {
  return json(500, body, init);
}

export function json(statusCode, body, init = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...init.headers,
  };
  return { statusCode, headers, body: JSON.stringify(body) };
}

export function handleOptions() {
  return {
    statusCode: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: '',
  };
}
