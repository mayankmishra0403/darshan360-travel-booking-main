import { databases, Query } from '../lib/backend';
import { Permission, Role } from 'appwrite';

const DB_ID = import.meta.env.VITE_DATABASE_ID || import.meta.env.VITE_APPWRITE_DATABASE_ID;
const BOOKINGS_COLLECTION_ID = import.meta.env.VITE_BOOKINGS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_BOOKINGS_COLLECTION_ID;

export async function listBookingsByUser(userId) {
  const res = await databases.listDocuments(DB_ID, BOOKINGS_COLLECTION_ID, [
    Query.equal('userId', userId),
  ]);
  const docs = res.documents;
  const remote = docs.map((d) => ({
    id: d.$id,
    tripId: d.tripId,
    tripTitle: d.tripTitle,
    status: d.status,
    date: d.date,
  }));

  // Merge local fallback bookings saved in localStorage (if any)
  try {
    const raw = localStorage.getItem('local_bookings');
    if (raw) {
      const local = JSON.parse(raw);
      const mine = Array.isArray(local) ? local.filter((b) => b.userId === userId) : [];
      // Avoid duplicates by id
      const ids = new Set(remote.map((r) => r.id));
      const merged = [...remote, ...mine.filter((m) => !ids.has(m.id))];
      return merged;
    }
  } catch (e) {
    console.warn('Failed to read local bookings fallback:', e?.message || e);
  }

  return remote;
}

export async function createBooking({ tripId, tripTitle, userId, status, date }) {
  // Let server-side permissions secure fields
  const permissions = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
  ];
  const res = await databases.createDocument(
    DB_ID,
    BOOKINGS_COLLECTION_ID,
    'unique()',
    { tripId, tripTitle, userId, status, date },
    permissions
  );
  return res;
}

// Create a booking with a specific id (e.g., Razorpay order id), useful to update later
export async function createBookingWithId({ id, tripId, tripTitle, userId, status, date }) {
  const permissions = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
  ];
  const res = await databases.createDocument(
    DB_ID,
    BOOKINGS_COLLECTION_ID,
    id,
    { tripId, tripTitle, userId, status, date },
    permissions
  );
  return res;
}

// Update an existing booking document
export async function updateBooking({ id, ...data }) {
  const res = await databases.updateDocument(DB_ID, BOOKINGS_COLLECTION_ID, id, data);
  return res;
}

// Fallback: save booking locally in localStorage when Appwrite create fails
export async function createBookingWithIdFallback({ id, tripId, tripTitle, userId, status, date }) {
  try {
    return await createBookingWithId({ id, tripId, tripTitle, userId, status, date });
  } catch (e) {
    // Save locally so "My Trips" shows the booking immediately
    try {
      const raw = localStorage.getItem('local_bookings');
      const arr = raw ? JSON.parse(raw) : [];
      const entry = { id, tripId, tripTitle, userId, status, date };
      arr.push(entry);
      localStorage.setItem('local_bookings', JSON.stringify(arr));
      return entry;
    } catch (err) {
      console.warn('Failed to save local booking fallback:', err?.message || err);
      throw e; // rethrow original error
    }
  }
}
