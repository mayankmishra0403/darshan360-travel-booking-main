import { Client, Account, Databases, Storage, Query } from "appwrite";

// Generic env names with fallback for compatibility
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || import.meta.env.VITE_APPWRITE_ENDPOINT;
const PROJECT_ID = import.meta.env.VITE_PROJECT_ID || import.meta.env.VITE_APPWRITE_PROJECT_ID;

const client = new Client()
    .setEndpoint(API_ENDPOINT)
    .setProject(PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

export { client, account, databases, storage, Query };
