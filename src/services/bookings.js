import { databases, Query } from '../lib/backend';
import { Permission, Role } from 'appwrite';

const DB_ID = import.meta.env.VITE_DATABASE_ID || import.meta.env.VITE_APPWRITE_DATABASE_ID;
const BOOKINGS_COLLECTION_ID = import.meta.env.VITE_BOOKINGS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_BOOKINGS_COLLECTION_ID;

export async function listBookingsByUser(userId) {
  const res = await databases.listDocuments(DB_ID, BOOKINGS_COLLECTION_ID, [
    Query.equal('userId', userId),
  ]);
  const docs = res.documents;
  return docs.map((d) => ({
    id: d.$id,
    tripId: d.tripId,
    tripTitle: d.tripTitle,
    status: d.status,
    date: d.date,
  }));
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
