import { databases, storage, Query } from '../lib/backend';

const DB_ID = import.meta.env.VITE_DATABASE_ID || import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TRIPS_COLLECTION_ID = import.meta.env.VITE_TRIPS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_TRIPS_COLLECTION_ID;
const BUCKET_ID = import.meta.env.VITE_BUCKET_ID || import.meta.env.VITE_APPWRITE_BUCKET_ID;
const TRIP_STOPS_COLLECTION_ID = import.meta.env.VITE_TRIP_STOPS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_TRIP_STOPS_COLLECTION_ID;

export async function listTrips() {
  const res = await databases.listDocuments(DB_ID, TRIPS_COLLECTION_ID);
  return res.documents.map((d) => formatTrip(d));
}

export function formatTrip(doc) {
  return {
    id: doc.$id,
    title: doc.title,
    price: doc.price,
    date: doc.date,
    // Prefer new array fields if available; fallback to single imageId
    imageIds: Array.isArray(doc.imageIds)
      ? doc.imageIds
      : (doc.imageId ? [doc.imageId] : []),
    // Stops can be stored as array of strings (legacy) or array of objects { name, description, imageId }
    stops: Array.isArray(doc.stops)
      ? doc.stops.map((s) => {
          if (!s) return null;
          if (typeof s === 'string') return { name: s };
          // assume object
          return s;
        }).filter(Boolean)
      : [],
  };
}

export function getTripImageUrl(imageId) {
  if (!imageId) return '';
  return storage.getFilePreview(BUCKET_ID, imageId, 800, 600, 'center').href;
}

export function getStopImageUrl(imageId) {
  return getTripImageUrl(imageId);
}

export function getTripImageUrls(imageIds = []) {
  return imageIds.map((id) => getTripImageUrl(id));
}

export async function getTrip(id) {
  const doc = await databases.getDocument(DB_ID, TRIPS_COLLECTION_ID, id);
  return formatTrip(doc);
}

export async function listStopsByTrip(tripId) {
  if (!TRIP_STOPS_COLLECTION_ID) return [];
  const res = await databases.listDocuments(DB_ID, TRIP_STOPS_COLLECTION_ID, [
    Query.equal('tripId', tripId),
    Query.orderAsc('order'),
  ]);
  return res.documents.map((d) => ({
    id: d.$id,
    name: d.name,
    description: d.description,
    imageId: d.imageId,
    order: d.order,
  }));
}
