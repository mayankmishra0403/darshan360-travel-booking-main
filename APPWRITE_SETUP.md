Appwrite setup for Darshan360 - Video attribute

This project stores an admin-uploaded trip video file id on the trips collection documents using the attribute key `video_file_id`.

Follow these steps in the Appwrite Console to allow saving and viewing videos:

1. Open Appwrite Console and select your Project.
2. Go to "Databases" → open your Trips collection (the collection ID referenced by `VITE_TRIPS_COLLECTION_ID`).
3. Click "Attributes" (or "Add Attribute").
4. Add a new attribute with these values:
   - Key / Attribute ID: `video_file_id`
   - Type: String (Text)
   - Max Length: 255
   - Required: No
   - Default Value: (leave empty)
5. Save the attribute.

Bucket and file view URL

The frontend builds a view URL like:

  {API_ENDPOINT}/storage/buckets/{BUCKET_ID}/files/{FILE_ID}/view?project={PROJECT_ID}

Ensure:
- `BUCKET_ID` (the bucket used to store media) is correct in your environment variables.
- If the bucket is private, the SDK's `createFile` returns a file id which the frontend uses with the `view` endpoint. Confirm CORS and bucket policies allow your site to access the file, or implement signed URLs if needed.

Verify

1. Upload a small test video in the Admin panel and save the trip.
2. In Appwrite Console → Databases → Trips, open the saved document and confirm the `video_file_id` field contains a file id string (e.g. `abc123...`).
3. Open the TripDetails page for that trip and check that the video plays.

Notes

- The code maps the collection's `video_file_id` to a runtime property `videoId` used by the UI helpers in `src/services/trips.js`.
- If you prefer a different attribute name (e.g. `videoId`), update the code and the collection attribute to the same name.
