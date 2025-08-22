import { databases, storage, Query } from '../lib/backend';

const DB_ID = import.meta.env.VITE_DATABASE_ID || import.meta.env.VITE_APPWRITE_DATABASE_ID;
const SERVICES_COLLECTION_ID = import.meta.env.VITE_SERVICES_COLLECTION_ID || import.meta.env.VITE_APPWRITE_SERVICES_COLLECTION_ID;
const SECTIONS_COLLECTION_ID = import.meta.env.VITE_SECTIONS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_SECTIONS_COLLECTION_ID;
const BUCKET_ID = import.meta.env.VITE_BUCKET_ID || import.meta.env.VITE_APPWRITE_BUCKET_ID;

// Services: simple items with title, description, imageId, order
export async function listServices() {
  if (!DB_ID || !SERVICES_COLLECTION_ID) return [];
  const res = await databases.listDocuments(DB_ID, SERVICES_COLLECTION_ID);
  return (res.documents || []).map((d) => ({
    id: d.$id,
    title: d.title,
    description: d.description,
  imageId: d.imageId || null,
  order: d.order || 0,
  tripId: d.tripId || null,
  }));
}

export async function createService({ title, description, imageFile, order = 0 }) {
  if (!DB_ID || !SERVICES_COLLECTION_ID) throw new Error('Services collection not configured');
  const payload = { title, description, order };
  // allow optional tripId association (passed via createService args)
  if (arguments[0] && typeof arguments[0].tripId !== 'undefined') payload.tripId = arguments[0].tripId || null;
  if (imageFile instanceof File && BUCKET_ID) {
    const r = await storage.createFile(BUCKET_ID, 'unique()', imageFile);
    payload.imageId = r.$id;
  }
  return await databases.createDocument(DB_ID, SERVICES_COLLECTION_ID, 'unique()', payload);
}

export async function updateService(id, { title, description, imageFile, imageId, order = 0 }) {
  if (!DB_ID || !SERVICES_COLLECTION_ID) throw new Error('Services collection not configured');
  const payload = { title, description, order };
  // allow updating trip association
  if (typeof arguments[1] !== 'undefined' && typeof arguments[1].tripId !== 'undefined') payload.tripId = arguments[1].tripId || null;
  if (imageFile instanceof File && BUCKET_ID) {
    const r = await storage.createFile(BUCKET_ID, 'unique()', imageFile);
    payload.imageId = r.$id;
  } else if (typeof imageId === 'string') {
    payload.imageId = imageId;
  }
  return await databases.updateDocument(DB_ID, SERVICES_COLLECTION_ID, id, payload);
}

export async function deleteService(id) {
  if (!DB_ID || !SERVICES_COLLECTION_ID) throw new Error('Services collection not configured');
  return await databases.deleteDocument(DB_ID, SERVICES_COLLECTION_ID, id);
}

// Sections: generic content blocks stored by key/title with markup/plain content
export async function listSections() {
  if (!DB_ID || !SECTIONS_COLLECTION_ID) return [];
  const res = await databases.listDocuments(DB_ID, SECTIONS_COLLECTION_ID);
  return (res.documents || []).map((d) => ({
    id: d.$id,
    key: d.key || null,
    title: d.title || null,
    content: d.content || '',
    imageId: d.imageId || null,
    order: d.order || 0,
  }));
}

export async function listServicesByTrip(tripId) {
  if (!DB_ID || !SERVICES_COLLECTION_ID) return [];
  if (!tripId) return [];
  const res = await databases.listDocuments(DB_ID, SERVICES_COLLECTION_ID, [Query.equal('tripId', tripId), Query.orderAsc('order')]);
  return (res.documents || []).map((d) => ({ id: d.$id, title: d.title, description: d.description, imageId: d.imageId || null, order: d.order || 0, tripId: d.tripId || null }));
}

export async function createSection({ key, title, content = '', imageFile, order = 0 }) {
  if (!DB_ID || !SECTIONS_COLLECTION_ID) throw new Error('Sections collection not configured');
  const payload = { key, title, content, order };
  if (imageFile instanceof File && BUCKET_ID) {
    const r = await storage.createFile(BUCKET_ID, 'unique()', imageFile);
    payload.imageId = r.$id;
  }
  return await databases.createDocument(DB_ID, SECTIONS_COLLECTION_ID, 'unique()', payload);
}

export async function updateSection(id, { key, title, content = '', imageFile, imageId, order = 0 }) {
  if (!DB_ID || !SECTIONS_COLLECTION_ID) throw new Error('Sections collection not configured');
  const payload = { key, title, content, order };
  if (imageFile instanceof File && BUCKET_ID) {
    const r = await storage.createFile(BUCKET_ID, 'unique()', imageFile);
    payload.imageId = r.$id;
  } else if (typeof imageId === 'string') {
    payload.imageId = imageId;
  }
  return await databases.updateDocument(DB_ID, SECTIONS_COLLECTION_ID, id, payload);
}

export async function deleteSection(id) {
  if (!DB_ID || !SECTIONS_COLLECTION_ID) throw new Error('Sections collection not configured');
  return await databases.deleteDocument(DB_ID, SECTIONS_COLLECTION_ID, id);
}

export default {
  listServices,
  createService,
  updateService,
  deleteService,
  listSections,
  createSection,
  updateSection,
  deleteSection,
};
