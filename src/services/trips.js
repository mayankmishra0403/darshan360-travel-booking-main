import { databases, Query } from '../lib/backend';

const DB_ID = import.meta.env.VITE_DATABASE_ID || import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TRIPS_COLLECTION_ID = import.meta.env.VITE_TRIPS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_TRIPS_COLLECTION_ID;
const BUCKET_ID = import.meta.env.VITE_BUCKET_ID || import.meta.env.VITE_APPWRITE_BUCKET_ID;
const TRIP_STOPS_COLLECTION_ID = import.meta.env.VITE_TRIP_STOPS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_TRIP_STOPS_COLLECTION_ID;

// Build a direct preview URL for Appwrite storage files.
// This avoids relying on SDK methods that may return objects/promises and lets the UI use a simple string URL.
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || import.meta.env.VITE_APPWRITE_ENDPOINT || '';
const PROJECT_ID = import.meta.env.VITE_PROJECT_ID || import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

function buildPreviewUrl(bucketId, fileId, width = 1200, height = 800, quality = 100, mode = 'center') {
  if (!API_ENDPOINT || !PROJECT_ID || !bucketId || !fileId) return '';
  // Ensure no trailing slash on endpoint
  const base = API_ENDPOINT.replace(/\/$/, '');
  const params = new URLSearchParams({ project: PROJECT_ID, width: String(width), height: String(height), quality: String(quality), mode });
  return `${base}/storage/buckets/${bucketId}/files/${fileId}/preview?${params.toString()}`;
}

// Build a direct view/download URL which serves the original file (no resizing/compression)
function buildViewUrl(bucketId, fileId) {
  if (!API_ENDPOINT || !PROJECT_ID || !bucketId || !fileId) return '';
  const base = API_ENDPOINT.replace(/\/$/, '');
  const params = new URLSearchParams({ project: PROJECT_ID });
  return `${base}/storage/buckets/${bucketId}/files/${fileId}/view?${params.toString()}`;
}

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
  // Optional video file id stored on the trip document
  videoId: doc.video_file_id || doc.videoId || null,
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

export function getTripImageUrl(imageId, { full = true } = {}) {
  if (!imageId) return '';
  // Default to full-quality original view. If consumers want a preview/thumb, pass { full: false }
  return full ? buildViewUrl(BUCKET_ID, imageId) : buildPreviewUrl(BUCKET_ID, imageId, 1200, 800, 100, 'center');
}

export function getStopImageUrl(imageId, { full = true } = {}) {
  if (!imageId) return '';
  return full ? buildViewUrl(BUCKET_ID, imageId) : buildPreviewUrl(BUCKET_ID, imageId, 1200, 800, 100, 'center');
}

export function getTripImageUrls(imageIds = []) {
  if (!Array.isArray(imageIds)) return [];
  return imageIds.map((id) => getTripImageUrl(id));
}

export function getTripVideoUrl(fileId) {
  if (!fileId) return '';
  return buildViewUrl(BUCKET_ID, fileId);
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
