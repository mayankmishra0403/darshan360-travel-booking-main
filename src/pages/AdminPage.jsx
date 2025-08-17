import { useState } from 'react';
import { databases, storage } from '../lib/backend';

const DB_ID = import.meta.env.VITE_DATABASE_ID || import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TRIPS_COLLECTION_ID = import.meta.env.VITE_TRIPS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_TRIPS_COLLECTION_ID;
const BUCKET_ID = import.meta.env.VITE_BUCKET_ID || import.meta.env.VITE_APPWRITE_BUCKET_ID;
const TRIP_STOPS_COLLECTION_ID = import.meta.env.VITE_TRIP_STOPS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_TRIP_STOPS_COLLECTION_ID;

export default function AdminPage() {
  const [form, setForm] = useState({ title: '', price: '', date: '' });
  const [stops, setStops] = useState([]); // { name, description, file }
  const [tripFiles, setTripFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const addStop = () => setStops((s) => [...s, { name: '', description: '', file: null }]);
  const updateStop = (idx, patch) => setStops((s) => s.map((st, i) => (i === idx ? { ...st, ...patch } : st)));
  const removeStop = (idx) => setStops((s) => s.filter((_, i) => i !== idx));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      // Upload trip-level images
      let imageIds = [];
      if (tripFiles && tripFiles.length > 0) {
        const uploads = tripFiles.map((f) => storage.createFile(BUCKET_ID, 'unique()', f));
        const results = await Promise.all(uploads);
        imageIds = results.map((r) => r.$id);
      }

      const priceNum = Number(form.price);
      const tripDoc = await databases.createDocument(DB_ID, TRIPS_COLLECTION_ID, 'unique()', {
        title: form.title,
        price: priceNum,
        date: form.date,
        imageIds,
      });

      // Create stop documents (one per stop)
      if (TRIP_STOPS_COLLECTION_ID) {
        let order = 0;
        for (const st of stops) {
          let stopImageId = null;
          if (st.file) {
            const res = await storage.createFile(BUCKET_ID, 'unique()', st.file);
            stopImageId = res.$id;
          }
          await databases.createDocument(DB_ID, TRIP_STOPS_COLLECTION_ID, 'unique()', {
            tripId: tripDoc.$id,
            name: st.name,
            description: st.description,
            imageId: stopImageId,
            order,
          });
          order += 1;
        }
      }
      setMessage('Trip added successfully.');
      setForm({ title: '', price: '', date: '' });
      setStops([]);
      setTripFiles([]);
    } catch (e) {
      console.error(e);
      setMessage(e.message || 'Failed to add trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold my-4">Admin Panel</h1>
      <form onSubmit={onSubmit} className="space-y-3 bg-white p-4 rounded border">
        <input
          type="text"
          required
          placeholder="Trip Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          required
          placeholder="Price (INR)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <input
          type="date"
          placeholder="Date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="w-full border p-2 rounded"
        />

        <div className="border p-3 rounded">
          <div className="flex justify-between items-center mb-2">
            <strong>Stops</strong>
            <button type="button" onClick={addStop} className="text-sm text-blue-600">Add Stop</button>
          </div>
          {stops.length === 0 && <div className="text-sm text-gray-500">No stops yet. Add stops with name, description and an optional image.</div>}
          <div className="space-y-2 mt-2">
            {stops.map((st, idx) => (
              <div key={idx} className="border p-2 rounded">
                <input placeholder="Stop name" value={st.name} onChange={(e) => updateStop(idx, { name: e.target.value })} className="w-full mb-1 p-1 border rounded" />
                <textarea placeholder="Description" value={st.description} onChange={(e) => updateStop(idx, { description: e.target.value })} className="w-full mb-1 p-1 border rounded" />
                <input type="file" accept="image/*" onChange={(e) => updateStop(idx, { file: e.target.files?.[0] || null })} />
                <div className="mt-1 text-right"><button type="button" onClick={() => removeStop(idx)} className="text-red-500 text-sm">Remove</button></div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Trip images (optional)</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setTripFiles(Array.from(e.target.files || []))} />
        </div>

        <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? 'Adding...' : 'Add Trip'}
        </button>
      </form>
      {message && <div className="mt-3 text-sm">{message}</div>}
      <div className="mt-8 text-gray-600 text-sm">
        Note: Ensure your backend permissions allow this user to write to the Trips collection and upload to the bucket.
      </div>
    </div>
  );
}
