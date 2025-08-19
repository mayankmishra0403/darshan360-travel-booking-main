import { databases } from '../lib/backend';
import { Permission, Role } from 'appwrite';

const DB_ID = import.meta.env.VITE_DATABASE_ID || import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PAYMENTS_COLLECTION_ID = import.meta.env.VITE_PAYMENTS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_PAYMENTS_COLLECTION_ID;

export async function createPaymentWithId({ id, data }) {
  const permissions = [
    Permission.read(Role.user(data.userId)),
    Permission.update(Role.user(data.userId)),
  ];
  return databases.createDocument(DB_ID, PAYMENTS_COLLECTION_ID, id, data, permissions);
}

export async function updatePayment({ id, data }) {
  return databases.updateDocument(DB_ID, PAYMENTS_COLLECTION_ID, id, data);
}
