import { useEffect, useState } from 'react';
import { databases, storage } from '../lib/backend';
import { getTripImageUrl, getTripVideoUrl } from '../services/trips';

const DB_ID = import.meta.env.VITE_DATABASE_ID || import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TRIPS_COLLECTION_ID = import.meta.env.VITE_TRIPS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_TRIPS_COLLECTION_ID;
const BUCKET_ID = import.meta.env.VITE_BUCKET_ID || import.meta.env.VITE_APPWRITE_BUCKET_ID;
const TRIP_STOPS_COLLECTION_ID = import.meta.env.VITE_TRIP_STOPS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_TRIP_STOPS_COLLECTION_ID;
const BOOKINGS_COLLECTION_ID = import.meta.env.VITE_BOOKINGS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_BOOKINGS_COLLECTION_ID;
const PAYMENTS_COLLECTION_ID = import.meta.env.VITE_PAYMENTS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_PAYMENTS_COLLECTION_ID;
const DEPLOY_HOOK = import.meta.env.VITE_NETLIFY_BUILD_HOOK || import.meta.env.VITE_DEPLOY_HOOK;

export default function AdminPage() {
  const [tab, setTab] = useState('trips');

  // Trips state
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  // Bookings
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Payments
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Form for create/edit
  const emptyForm = { id: null, title: '', price: '', date: '', imageIds: [] };
  const [form, setForm] = useState(emptyForm);
  const [stops, setStops] = useState([]); // { id?, name, description, file }
  const [tripFiles, setTripFiles] = useState([]);
  const [replacedImages, setReplacedImages] = useState({}); // index -> File
  const [removedImageIndices, setRemovedImageIndices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [videoTestUrl, setVideoTestUrl] = useState('');

  useEffect(() => {
    if (tab === 'trips') loadTrips();
    if (tab === 'bookings') loadBookings();
    if (tab === 'payments') loadPayments();
  }, [tab]);

  async function loadTrips() {
    if (!DB_ID || !TRIPS_COLLECTION_ID) return setMessage('Trips collection not configured');
    setLoadingTrips(true);
    setMessage('');
    try {
      const res = await databases.listDocuments(DB_ID, TRIPS_COLLECTION_ID);
      setTrips(res.documents || []);
    } catch (e) {
      console.error(e);
      setMessage(e.message || 'Failed to load trips');
    } finally {
      setLoadingTrips(false);
    }
  }

  async function loadBookings() {
    if (!DB_ID || !BOOKINGS_COLLECTION_ID) return setMessage('Bookings collection not configured');
    setLoadingBookings(true);
    setMessage('');
    try {
      const res = await databases.listDocuments(DB_ID, BOOKINGS_COLLECTION_ID);
      setBookings(res.documents || []);
    } catch (e) {
      console.error(e);
      setMessage(e.message || 'Failed to load bookings');
    } finally {
      setLoadingBookings(false);
    }
  }

  async function loadPayments() {
    if (!DB_ID || !PAYMENTS_COLLECTION_ID) return setMessage('Payments collection not configured');
    setLoadingPayments(true);
    setMessage('');
    try {
      const res = await databases.listDocuments(DB_ID, PAYMENTS_COLLECTION_ID);
      setPayments(res.documents || []);
    } catch (e) {
      console.error(e);
      setMessage(e.message || 'Failed to load payments');
    } finally {
      setLoadingPayments(false);
    }
  }

  // Trip stop helpers
  const addStop = () => setStops((s) => [...s, { name: '', description: '', file: null }]);
  const updateStop = (idx, patch) => setStops((s) => s.map((st, i) => (i === idx ? { ...st, ...patch } : st)));
  const removeStop = (idx) => setStops((s) => s.filter((_, i) => i !== idx));

  async function saveTrip(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!DB_ID || !TRIPS_COLLECTION_ID) return setMessage('Trips collection not configured');
    setSaving(true);
    setMessage('');
    try {
      // Prepare trip-level images: handle replaced images, removals, and new uploads
      const initialIds = Array.isArray(form.imageIds) ? [...form.imageIds] : [];
      const finalIds = [];

      // First, process existing slots
      for (let i = 0; i < initialIds.length; i++) {
        if (removedImageIndices.includes(i)) {
          // skip this image
          continue;
        }
        if (replacedImages[i]) {
          // upload replacement file
          const res = await storage.createFile(BUCKET_ID, 'unique()', replacedImages[i]);
          finalIds.push(res.$id);
        } else {
          finalIds.push(initialIds[i]);
        }
      }

      // Then upload any newly added tripFiles and append
      if (tripFiles && tripFiles.length > 0) {
        const uploads = tripFiles.map((f) => storage.createFile(BUCKET_ID, 'unique()', f));
        const results = await Promise.all(uploads);
        finalIds.push(...results.map((r) => r.$id));
      }

  // If admin provided a video file for the trip, upload it and include videoId
  // NOTE: We persist the uploaded file id in the trips collection under the
  // attribute key `video_file_id` (string). Ensure your Appwrite collection
  // has a String attribute `video_file_id` (recommended max length 255).
  let videoIdToSave = form.videoId || null;
      if (form.videoFile instanceof File) {
        const resVideo = await storage.createFile(BUCKET_ID, 'unique()', form.videoFile);
        videoIdToSave = resVideo.$id;
      }

      const payload = {
        title: form.title,
        price: Number(form.price || 0),
        date: form.date || null,
        imageIds: finalIds,
  // Use 'video_file_id' field to match collection's allowed attributes
  // (this is the file id returned by Appwrite storage.createFile)
  video_file_id: videoIdToSave,
      };

      let tripDoc;
      if (form.id) {
        tripDoc = await databases.updateDocument(DB_ID, TRIPS_COLLECTION_ID, form.id, payload);
      } else {
        tripDoc = await databases.createDocument(DB_ID, TRIPS_COLLECTION_ID, 'unique()', payload);
      }

      // Handle stops: create new stops or update existing ones
      if (TRIP_STOPS_COLLECTION_ID && stops.length > 0) {
        for (const st of stops) {
          if (st.id) {
            // update existing stop if changed or if a replacement file provided
            const updatePayload = { name: st.name, description: st.description };
            if (st.file && st.file instanceof File) {
              const res = await storage.createFile(BUCKET_ID, 'unique()', st.file);
              updatePayload.imageId = res.$id;
            }
            await databases.updateDocument(DB_ID, TRIP_STOPS_COLLECTION_ID, st.id, updatePayload);
          } else {
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
              order: st.order || 0,
            });
          }
        }
      }

  // Log and show the saved trip and the uploaded video file id (if any) so admins can verify
      console.info('Saved trip', tripDoc, 'video_file_id', videoIdToSave);
      setMessage(`Saved trip successfully${videoIdToSave ? ` (video_file_id: ${videoIdToSave})` : ''}`);
      // If a video was saved, compute a test URL (uses proxy if configured in frontend env)
      if (videoIdToSave) {
        const url = getTripVideoUrl(videoIdToSave);
        setVideoTestUrl(url);
      } else {
        setVideoTestUrl('');
      }
      setForm(emptyForm);
      setStops([]);
      setTripFiles([]);
  setReplacedImages({});
  setRemovedImageIndices([]);
      loadTrips();
    } catch (e) {
      console.error(e);
      setMessage(e.message || 'Failed to save trip');
    } finally {
      setSaving(false);
    }
  }

  async function editTrip(t) {
    setForm({ id: t.$id, title: t.title || '', price: t.price || '', date: t.date || '', imageIds: t.imageIds || [] });
  setReplacedImages({});
  setRemovedImageIndices([]);
    // load stops for trip
    if (TRIP_STOPS_COLLECTION_ID) {
      try {
        const res = await databases.listDocuments(DB_ID, TRIP_STOPS_COLLECTION_ID, [
          // order not required but helpful
        ]);
        const mine = (res.documents || []).filter((s) => s.tripId === t.$id).map((s) => ({ id: s.$id, name: s.name, description: s.description, imageId: s.imageId }));
        setStops(mine);
      } catch (err) {
        console.warn('Failed to load stops for edit:', err?.message || err);
        setStops([]);
      }
    } else {
      setStops([]);
    }
    setTab('trips');
  }

  async function deleteTrip(id) {
    if (!confirm('Delete trip permanently?')) return;
    try {
      await databases.deleteDocument(DB_ID, TRIPS_COLLECTION_ID, id);
      setMessage('Trip deleted');
      loadTrips();
    } catch (e) {
      console.error(e);
      setMessage(e.message || 'Failed to delete trip');
    }
  }

  // Bookings actions
  async function markBooking(id, status) {
    try {
      await databases.updateDocument(DB_ID, BOOKINGS_COLLECTION_ID, id, { status });
      setMessage('Booking updated');
      loadBookings();
    } catch (e) {
      console.error(e);
      setMessage(e.message || 'Failed to update booking');
    }
  }

  async function deleteBooking(id) {
    if (!confirm('Delete booking?')) return;
    try {
      await databases.deleteDocument(DB_ID, BOOKINGS_COLLECTION_ID, id);
      setMessage('Booking deleted');
      loadBookings();
    } catch (e) {
      console.error(e);
      setMessage(e.message || 'Failed to delete booking');
    }
  }

  // Payments actions
  async function deletePayment(id) {
    if (!confirm('Delete payment record?')) return;
    try {
      await databases.deleteDocument(DB_ID, PAYMENTS_COLLECTION_ID, id);
      setMessage('Payment deleted');
      loadPayments();
    } catch (e) {
      console.error(e);
      setMessage(e.message || 'Failed to delete payment');
    }
  }

  // Deploy hook
  async function triggerDeploy() {
    if (!DEPLOY_HOOK) return setMessage('No deploy hook configured in environment');
    setMessage('Triggering deploy...');
    try {
      const res = await fetch(DEPLOY_HOOK, { method: 'POST' });
      if (!res.ok) throw new Error(`Deploy hook returned ${res.status}`);
      setMessage('Deploy triggered successfully');
    } catch (e) {
      console.error(e);
      setMessage(e.message || 'Failed to trigger deploy');
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold my-4">Admin Panel</h1>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('trips')} className={`px-3 py-1 rounded ${tab === 'trips' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Trips</button>
        <button onClick={() => setTab('bookings')} className={`px-3 py-1 rounded ${tab === 'bookings' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Bookings</button>
        <button onClick={() => setTab('payments')} className={`px-3 py-1 rounded ${tab === 'payments' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Payments</button>
        <button onClick={() => setTab('deploy')} className={`px-3 py-1 rounded ${tab === 'deploy' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Deploy</button>
        <div className="ml-auto text-sm text-gray-600">{message}</div>
      </div>

      {tab === 'trips' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Trips</h2>
              <div>
                <button onClick={loadTrips} className="mr-2 px-2 py-1 bg-gray-100 rounded">Refresh</button>
                <button onClick={() => { setForm(emptyForm); setStops([]); setTripFiles([]); }} className="px-2 py-1 bg-gray-100 rounded">New</button>
              </div>
            </div>
            {loadingTrips ? <div>Loading trips...</div> : (
              <ul className="space-y-3">
                {trips.map((t) => (
                  <li key={t.$id} className="border rounded p-3 flex justify-between">
                    <div>
                      <div className="font-semibold">{t.title}</div>
                      <div className="text-sm text-gray-600">Price: ₹{t.price} · Date: {t.date}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editTrip(t)} className="px-2 py-1 bg-yellow-100 rounded">Edit</button>
                      <button onClick={() => deleteTrip(t.$id)} className="px-2 py-1 bg-red-100 rounded">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="col-span-1 bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-2">Create / Edit Trip</h3>
            <form onSubmit={saveTrip} className="space-y-2">
              <input className="w-full border p-2 rounded" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" required />
              <input className="w-full border p-2 rounded" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price" type="number" />
              <input className="w-full border p-2 rounded" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="Date" type="date" />

              <div className="border p-2 rounded">
                <div className="flex justify-between items-center mb-2">
                  <strong>Stops</strong>
                  <button type="button" onClick={addStop} className="text-sm text-blue-600">Add Stop</button>
                </div>
                <div className="space-y-2">
                  {stops.map((st, idx) => (
                    <div key={idx} className="border p-2 rounded">
                      <input placeholder="Stop name" value={st.name || ''} onChange={(e) => updateStop(idx, { name: e.target.value })} className="w-full mb-1 p-1 border rounded" />
                      <textarea placeholder="Description" value={st.description || ''} onChange={(e) => updateStop(idx, { description: e.target.value })} className="w-full mb-1 p-1 border rounded" />
                      <input type="file" accept="image/*" onChange={(e) => updateStop(idx, { file: e.target.files?.[0] || null })} />
                      <div className="mt-1 text-right"><button type="button" onClick={() => removeStop(idx)} className="text-red-500 text-sm">Remove</button></div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Trip images (optional)</label>

                {/* Existing images (when editing) */}
                {Array.isArray(form.imageIds) && form.imageIds.length > 0 && (
                  <div className="mb-2 grid grid-cols-3 gap-2">
                    {form.imageIds.map((imgId, idx) => (
                      <div key={idx} className="relative border rounded overflow-hidden">
                        <img src={replacedImages[idx] ? URL.createObjectURL(replacedImages[idx]) : getTripImageUrl(imgId)} alt={`img-${idx}`} className="w-full h-28 object-cover" />
                        <div className="p-1 flex gap-1">
                          <label className="text-xs px-2 py-1 bg-gray-100 rounded cursor-pointer">
                            Replace
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setReplacedImages((s) => ({ ...s, [idx]: f }));
                            }} />
                          </label>
                          <button type="button" onClick={() => setRemovedImageIndices((a) => Array.from(new Set([...a, idx])))} className="text-xs px-2 py-1 bg-red-100 rounded">Remove</button>
                        </div>
                        {removedImageIndices.includes(idx) && <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-red-600 font-semibold">Removed</div>}
                      </div>
                    ))}
                  </div>
                )}

                <input type="file" accept="image/*" multiple onChange={(e) => setTripFiles(Array.from(e.target.files || []))} />
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium mb-1">Trip video (optional) — MP4/WEBM</label>
                <input type="file" accept="video/*" onChange={(e) => setForm((f) => ({ ...f, videoFile: e.target.files?.[0] || null }))} />
                {form.videoId && !form.videoFile && (
                  <div className="mt-2 text-sm text-gray-600">Existing video attached</div>
                )}
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="bg-blue-600 text-white px-3 py-1 rounded">{saving ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => { setForm(emptyForm); setStops([]); setTripFiles([]); }} className="px-3 py-1 rounded bg-gray-100">Cancel</button>
              </div>
              {videoTestUrl && (
                <div className="mt-2">
                  <button type="button" onClick={() => window.open(videoTestUrl, '_blank')} className="px-3 py-1 rounded bg-green-600 text-white">Open video URL</button>
                  <div className="text-xs text-gray-600 mt-1">Opens proxied URL if `VITE_MEDIA_PROXY` is configured, otherwise Appwrite view URL.</div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {tab === 'bookings' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Bookings</h2>
            <button onClick={loadBookings} className="px-2 py-1 bg-gray-100 rounded">Refresh</button>
          </div>
          {loadingBookings ? <div>Loading bookings...</div> : (
            <ul className="space-y-2">
              {bookings.map((b) => (
                <li key={b.$id} className="border rounded p-3 flex justify-between">
                  <div>
                    <div className="font-semibold">{b.tripTitle || b.tripId}</div>
                    <div className="text-sm text-gray-600">User: {b.userId} · Date: {b.date}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-2 py-1 rounded text-sm ${((b.status||'').toLowerCase() === 'paid') ? 'bg-green-100 text-green-800' : ((b.status||'').toLowerCase() === 'failed') ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{b.status || 'pending'}</div>
                    <div className="flex gap-2">
                      <button onClick={() => markBooking(b.$id, 'paid')} className="px-2 py-1 bg-green-100 rounded">Mark Paid</button>
                      <button onClick={() => markBooking(b.$id, 'failed')} className="px-2 py-1 bg-red-100 rounded">Mark Failed</button>
                      <button onClick={() => deleteBooking(b.$id)} className="px-2 py-1 bg-gray-100 rounded">Delete</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'payments' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Payments</h2>
            <button onClick={loadPayments} className="px-2 py-1 bg-gray-100 rounded">Refresh</button>
          </div>
          {loadingPayments ? <div>Loading payments...</div> : (
            <ul className="space-y-2">
              {payments.map((p) => (
                <li key={p.$id} className="border rounded p-3 flex justify-between">
                  <div>
                    <div className="font-semibold">Amount: ₹{p.amount || p.amount_paid || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Method: {p.method || p.gateway || 'N/A'} · Booking: {p.bookingId || p.orderId}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-2 py-1 rounded text-sm ${((p.status||'').toLowerCase() === 'paid') ? 'bg-green-100 text-green-800' : ((p.status||'').toLowerCase() === 'failed') ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.status || 'pending'}</div>
                    <div className="flex gap-2">
                      <button onClick={() => deletePayment(p.$id)} className="px-2 py-1 bg-gray-100 rounded">Delete</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'deploy' && (
        <div className="bg-white p-4 rounded">
          <h2 className="font-semibold mb-2">Deploy / Build</h2>
          <div className="mb-3 text-sm text-gray-600">You can trigger a site deploy/build if you configured a build hook URL in environment variable <code>VITE_NETLIFY_BUILD_HOOK</code> or <code>VITE_DEPLOY_HOOK</code>.</div>
          <div className="flex gap-2">
            <button onClick={triggerDeploy} className="px-3 py-1 bg-indigo-600 text-white rounded">Trigger Deploy</button>
            <a className="px-3 py-1 bg-gray-100 rounded" href="/admin/export" onClick={(e) => e.preventDefault()}>Export site (not implemented)</a>
          </div>
          {!DEPLOY_HOOK && <div className="mt-3 text-sm text-red-500">No deploy hook configured. Set <code>VITE_NETLIFY_BUILD_HOOK</code> in your environment to enable one-click deploys.</div>}
        </div>
      )}
    </div>
  );
}
