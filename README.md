# Darshan 360 — Travel Booking React App

A simple travel booking web app built with React, using a hosted backend for auth/database/storage and Razorpay for payments.

## Features

- Auth: Sign up, login, logout
- Auth: Sign up, login (email/password) and Login with Google
- Trips: Fetch trips from a database and images from storage
- Trips: Each trip supports multiple images and multiple destination stops
- Payments: Razorpay Checkout integration to pay for a trip
- Bookings: Store successful payments as bookings; view "My Bookings"
 - Admin Panel: Email-allowlisted admin users can add trips (with image upload)

## Setup

1) Install dependencies

```
npm install
```

2) Configure `.env`

Fill the following with your backend and Razorpay details:

```
VITE_API_ENDPOINT=
VITE_PROJECT_ID=
VITE_DATABASE_ID=
VITE_TRIPS_COLLECTION_ID=
VITE_BOOKINGS_COLLECTION_ID=
VITE_BUCKET_ID=
VITE_RAZORPAY_KEY_ID=
VITE_BACKEND_URL=http://localhost:8787
# Admin allowlist (comma-separated emails of admins)
VITE_ADMIN_EMAILS="admin@example.com"
```

3) Data structure

- Database: `VITE_DATABASE_ID`
   - Collection Trips: `VITE_TRIPS_COLLECTION_ID`
      - Attributes: `title` (string), `price` (number), `date` (string or date),
         `imageIds` (array of strings, file IDs in Storage; falls back to legacy `imageId`),
         `stops` (array of strings; e.g., ["Mumbai", "Pune", "Goa"]).
   - Collection Bookings: `VITE_BOOKINGS_COLLECTION_ID`
      - Attributes: `tripId` (string), `tripTitle` (string), `userId` (string), `status` (string: paid/pending), `date` (string/date)
- Storage Bucket: `VITE_BUCKET_ID` (for trip images)

4) Backend endpoints for Razorpay

Expose two endpoints from your server or serverless function:

- `POST {VITE_BACKEND_URL}/create-order`
   - Request: `{ amount: number, currency: 'INR', receipt: string }`
   - Response: `{ id, amount, currency, ... }` (Razorpay order object)

- `POST {VITE_BACKEND_URL}/verify-payment`
   - Request: `{ order, razorpay, trip, userId }`
   - Verify signature and on success create a booking document in your database.

5) Backend for payments (optional)

There is a minimal server in `server/` for Razorpay order creation and verification.

Steps:
- Copy `server/.env.example` to `server/.env` and fill:
   - `RAZORPAY_KEY_ID=rzp_test_R6Q4pLvlSs00K2`
   - `RAZORPAY_KEY_SECRET=ggyNLW45duhRypCQ5NCZadzW`
   - `PORT=8787` (default)
- Install and run:

```powershell
cd server
npm install
npm start
```

In your root `.env`, ensure:

```
VITE_BACKEND_URL=http://localhost:8787
VITE_RAZORPAY_KEY_ID=rzp_test_R6Q4pLvlSs00K2
```

6) Run the dev server

```
npm run dev
```

## Deploy to Netlify

This repo includes Netlify Functions for Razorpay endpoints and a `netlify.toml` config.

1) Push to GitHub/GitLab/Bitbucket.
2) In Netlify → Add new site → Import from your repo.
3) Build command: `npm run build`, Publish directory: `dist`.
4) Environment variables (Site settings → Environment):
    - `VITE_API_ENDPOINT`
    - `VITE_PROJECT_ID`
    - `VITE_DATABASE_ID`
    - `VITE_TRIPS_COLLECTION_ID`
    - `VITE_BOOKINGS_COLLECTION_ID`
    - `VITE_PAYMENTS_COLLECTION_ID` (if used)
    - `VITE_BUCKET_ID`
    - `VITE_TRIP_STOPS_COLLECTION_ID` (optional)
    - `VITE_RAZORPAY_KEY_ID`
    - Optional (to enable server-side booking recording):
       - `APPWRITE_ENDPOINT` or `VITE_API_ENDPOINT`
       - `APPWRITE_PROJECT_ID` or `VITE_PROJECT_ID`
       - `APPWRITE_API_KEY` (server key with Databases write)
       - `APPWRITE_DATABASE_ID` or `VITE_DATABASE_ID`
       - `APPWRITE_BOOKINGS_COLLECTION_ID` or `VITE_BOOKINGS_COLLECTION_ID`
       - `APPWRITE_PAYMENTS_COLLECTION_ID` or `VITE_PAYMENTS_COLLECTION_ID`

Endpoints will be available under `/api/*` via Netlify Functions. The app defaults to `/api` in production if `VITE_BACKEND_URL` is not set.

## Notes

- "Pay Now" is shown only when logged in.
- Replace placeholder env IDs with your actual IDs.
- Ensure your collection permissions allow the app to read trips and the current user to create/read their bookings.
- Admin Panel: Allowlisted emails see an "Admin Panel" link in the header after login. Ensure their account has permissions to create documents in Trips and upload to the Storage bucket.

### Enable Google Login

1. In your auth provider console → Enable Google
2. Add OAuth Redirect URLs:
   - Success: `http://localhost:5173/` (or your deployed origin)
   - Failure: `http://localhost:5173/login`
3. Optionally set overrides in `.env`:

```
VITE_GOOGLE_SUCCESS_REDIRECT=http://localhost:5173/
VITE_GOOGLE_FAILURE_REDIRECT=http://localhost:5173/login
```