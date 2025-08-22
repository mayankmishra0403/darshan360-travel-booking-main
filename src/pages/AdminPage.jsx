import { useEffect, useState } from 'react';
import { databases, storage } from '../lib/backend';
import { getTripImageUrl, getStopImageUrl, getStopVideoUrl } from '../services/trips';
import * as contentService from '../services/content';

const DB_ID = import.meta.env.VITE_DATABASE_ID || import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TRIPS_COLLECTION_ID = import.meta.env.VITE_TRIPS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_TRIPS_COLLECTION_ID;
const BUCKET_ID = import.meta.env.VITE_BUCKET_ID || import.meta.env.VITE_APPWRITE_BUCKET_ID;
const TRIP_STOPS_COLLECTION_ID = import.meta.env.VITE_TRIP_STOPS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_TRIP_STOPS_COLLECTION_ID;
const BOOKINGS_COLLECTION_ID = import.meta.env.VITE_BOOKINGS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_BOOKINGS_COLLECTION_ID;
const PAYMENTS_COLLECTION_ID = import.meta.env.VITE_PAYMENTS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_PAYMENTS_COLLECTION_ID;
const DEPLOY_HOOK = import.meta.env.VITE_NETLIFY_BUILD_HOOK || import.meta.env.VITE_DEPLOY_HOOK;

export default function AdminPage() {
  const [tab, setTab] = useState('trips');

  // Services & Sections
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  // reuse trips from above (already present)
  const [sections, setSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  // forms for services/sections
  const [serviceForm, setServiceForm] = useState({ id: null, title: '', description: '', imageFile: null, imageId: null, order: 0 });
  const [sectionForm, setSectionForm] = useState({ id: null, key: '', title: '', content: '', imageFile: null, imageId: null, order: 0 });

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
  const emptyForm = { id: null, title: '', price: '', date: '', imageIds: [], priority: false };
  const [form, setForm] = useState(emptyForm);
  const [tripVideo, setTripVideo] = useState(null);
  const [tripVideoId, setTripVideoId] = useState(null);
  // stops: array of { id?, name, description, images: [ imageId|string | File ] }
  const [stops, setStops] = useState([]);
  const [tripFiles, setTripFiles] = useState([]);
  const [replacedImages, setReplacedImages] = useState({}); // index -> File
  const [removedImageIndices, setRemovedImageIndices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (tab === 'trips') loadTrips();
    if (tab === 'bookings') loadBookings();
    if (tab === 'payments') loadPayments();
    if (tab === 'services') loadServices();
    if (tab === 'sections') loadSections();
  }, [tab]);

  async function loadServices() {
    setLoadingServices(true);
    setMessage('');
    try {
      const res = await contentService.listServices();
      setServices(res || []);
    } catch (e) {
      console.error(e);
      setMessage(e.message || 'Failed to load services');
    } finally {
      setLoadingServices(false);
    }
  }

  async function loadSections() {
    setLoadingSections(true);
    setMessage('');
    try {
      const res = await contentService.listSections();
      setSections(res || []);
    } catch (e) {
      console.error(e);
      setMessage(e.message || 'Failed to load sections');
    } finally {
      setLoadingSections(false);
    }
  }

  async function saveService(e) {
    if (e && e.preventDefault) e.preventDefault();
    setMessage('');
    try {
      if (serviceForm.id) {
        await contentService.updateService(serviceForm.id, serviceForm);
        setMessage('Service updated');
      } else {
        await contentService.createService(serviceForm);
        setMessage('Service created');
      }
      setServiceForm({ id: null, title: '', description: '', imageFile: null, imageId: null, order: 0 });
      loadServices();
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Failed to save service');
    }
  }

  async function editService(s) {
    setServiceForm({ id: s.id, title: s.title || '', description: s.description || '', imageFile: null, imageId: s.imageId || null, order: s.order || 0 });
    setTab('services');
  }

  async function removeService(id) {
    if (!confirm('Delete service?')) return;
    try {
      await contentService.deleteService(id);
      setMessage('Service deleted');
      loadServices();
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Failed to delete service');
    }
  }

  async function saveSection(e) {
    if (e && e.preventDefault) e.preventDefault();
    setMessage('');
    try {
      if (sectionForm.id) {
        await contentService.updateSection(sectionForm.id, sectionForm);
        setMessage('Section updated');
      } else {
        await contentService.createSection(sectionForm);
        setMessage('Section created');
      }
      setSectionForm({ id: null, key: '', title: '', content: '', imageFile: null, imageId: null, order: 0 });
      loadSections();
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Failed to save section');
    }
  }

  async function editSection(s) {
    setSectionForm({ id: s.id, key: s.key || '', title: s.title || '', content: s.content || '', imageFile: null, imageId: s.imageId || null, order: s.order || 0 });
    setTab('sections');
  }

  async function removeSection(id) {
    if (!confirm('Delete section?')) return;
    try {
      await contentService.deleteSection(id);
      setMessage('Section deleted');
      loadSections();
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Failed to delete section');
    }
  }

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
  const addStop = () => setStops((s) => [...s, { name: '', description: '', images: [], video: null, videoId: null, extraDetails: '' }]);
  const updateStop = (idx, patch) => setStops((s) => s.map((st, i) => (i === idx ? { ...st, ...patch } : st)));
  const removeStop = (idx) => setStops((s) => s.filter((_, i) => i !== idx));

  const addFilesToStop = (idx, files) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setStops((s) => s.map((st, i) => (i === idx ? { ...st, images: [...(st.images || []), ...arr] } : st)));
  };

  const removeImageFromStop = (idx, imageIndex) => {
    setStops((s) => s.map((st, i) => {
      if (i !== idx) return st;
      const imgs = Array.isArray(st.images) ? [...st.images] : [];
      imgs.splice(imageIndex, 1);
      return { ...st, images: imgs };
    }));
  };

  const setVideoForStop = (idx, file) => {
    setStops((s) => s.map((st, i) => (i === idx ? { ...st, video: file, videoId: null } : st)));
  };
  const clearVideoForStop = (idx) => {
    setStops((s) => s.map((st, i) => (i === idx ? { ...st, video: null, videoId: null } : st)));
  };

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

          const payload = {
            title: form.title,
            price: Number(form.price || 0),
            date: form.date || null,
            imageIds: finalIds,
            // persist priority flag (boolean)
            priority: Boolean(form.priority),
          };

      // Handle trip-level video upload (if provided)
      let uploadedTripVideoId = null;
      if (tripVideo instanceof File) {
        try {
          const r = await storage.createFile(BUCKET_ID, 'unique()', tripVideo);
          uploadedTripVideoId = r.$id;
          // attach to payload; if backend doesn't accept it we'll cleanup later
          payload.videoId = r.$id;
        } catch (err) {
          console.warn('Failed to upload trip-level video:', err?.message || err);
        }
      } else if (typeof tripVideoId === 'string' && tripVideoId) {
        payload.videoId = tripVideoId;
      }

      let tripDoc;
      // Create or update the trip document normally. You added the `priority` attribute
      // in Appwrite so we no longer need to strip it on failure.
      if (form.id) {
        tripDoc = await databases.updateDocument(DB_ID, TRIPS_COLLECTION_ID, form.id, payload);
      } else {
        tripDoc = await databases.createDocument(DB_ID, TRIPS_COLLECTION_ID, 'unique()', payload);
      }

  // If trip-level video wasn't accepted by the backend (unknown attribute), remove uploaded file
  // We detect this later after stops processing since we only know response errors during create/update.

      // Handle stops: support multiple images per stop (images array may contain File objects or existing image IDs)
      if (TRIP_STOPS_COLLECTION_ID && stops.length > 0) {
        let imagesUnsupported = false; // set to true if backend rejects 'images' attribute
        let videoUnsupported = false;  // set to true if backend rejects 'videoId' attribute
  for (const st of stops) {
          // Prepare images: upload any File objects and collect final image ids
          const finalImageIds = [];
          if (Array.isArray(st.images)) {
            for (const item of st.images) {
              if (item instanceof File) {
                const res = await storage.createFile(BUCKET_ID, 'unique()', item);
                finalImageIds.push(res.$id);
              } else if (typeof item === 'string' && item) {
                finalImageIds.push(item);
              }
            }
          }

          // Upload video if provided as File
      let videoId = st.videoId || null;
      let uploadedVideoId = null;
          if (st.video instanceof File) {
            try {
              const v = await storage.createFile(BUCKET_ID, 'unique()', st.video);
              videoId = v.$id;
        uploadedVideoId = v.$id;
            } catch (err) {
              console.warn('Failed to upload stop video:', err?.message || err);
            }
          }

          // Try to save using the new 'images' array first. If the Appwrite collection
          // doesn't have an 'images' attribute configured, Appwrite will reject the
          // document. In that case, retry with the legacy single 'imageId' attribute
          // (first image) so the save still succeeds.
          if (st.id) {
            const updatePayload = { name: st.name, description: st.description, images: finalImageIds, videoId };
            if (typeof st.extraDetails === 'string') updatePayload.extraDetails = st.extraDetails;
            try {
              await databases.updateDocument(DB_ID, TRIP_STOPS_COLLECTION_ID, st.id, updatePayload);
            } catch (err) {
              const msg = String(err?.message || err || '');
              if (/Unknown attribute|Invalid document structure|unknown attribute/i.test(msg)) {
                // fallback to single imageId
                imagesUnsupported = true;
                const fallback = { name: st.name, description: st.description, imageId: finalImageIds[0] || null };
                await databases.updateDocument(DB_ID, TRIP_STOPS_COLLECTION_ID, st.id, fallback);
                if (uploadedVideoId) {
                  try {
                    await storage.deleteFile(BUCKET_ID, uploadedVideoId);
                  } catch (delErr) {
                    console.warn('Failed to cleanup uploaded video on fallback:', delErr?.message || delErr);
                  }
                  videoUnsupported = true;
                }
              } else {
                throw err;
              }
            }
          } else {
            const createPayload = {
              tripId: tripDoc.$id,
              name: st.name,
              description: st.description,
              images: finalImageIds,
              videoId,
              order: st.order || 0,
            };
            if (typeof st.extraDetails === 'string') createPayload.extraDetails = st.extraDetails;
            try {
              await databases.createDocument(DB_ID, TRIP_STOPS_COLLECTION_ID, 'unique()', createPayload);
            } catch (err) {
              const msg = String(err?.message || err || '');
              if (/Unknown attribute|Invalid document structure|unknown attribute/i.test(msg)) {
                imagesUnsupported = true;
                const fallback = {
                  tripId: tripDoc.$id,
                  name: st.name,
                  description: st.description,
                  imageId: finalImageIds[0] || null,
                  order: st.order || 0,
                };
                await databases.createDocument(DB_ID, TRIP_STOPS_COLLECTION_ID, 'unique()', fallback);
                if (uploadedVideoId) {
                  try {
                    await storage.deleteFile(BUCKET_ID, uploadedVideoId);
                  } catch (delErr) {
                    console.warn('Failed to cleanup uploaded video on fallback:', delErr?.message || delErr);
                  }
                  videoUnsupported = true;
                }
              } else {
                throw err;
              }
            }
          }
        }

        if (imagesUnsupported || videoUnsupported) {
          let msg = '';
          if (imagesUnsupported) {
            msg += 'Note: collection lacks "images" attribute; saved stops using legacy single imageId. Add "images" (array<string>) to Trip Stops in Appwrite. ';
          }
          if (videoUnsupported) {
            msg += 'Note: collection lacks "videoId" attribute; the uploaded video could not be saved. Add a "videoId" (string) attribute to Trip Stops in Appwrite.';
          }
          // If trip-level video was uploaded but collection doesn't accept videoId, cleanup and mention it
          if (uploadedTripVideoId) {
            try {
              await storage.deleteFile(BUCKET_ID, uploadedTripVideoId);
            } catch (delErr) { console.warn('Failed to cleanup uploaded trip video:', delErr?.message || delErr); }
            msg += ' Also: trip-level video was uploaded but could not be saved; add "videoId" to the Trips collection.';
          }
          setMessage(msg.trim());
        }
      }

  setMessage('Saved trip successfully');
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
  setForm({ id: t.$id, title: t.title || '', price: t.price || '', date: t.date || '', imageIds: t.imageIds || [], priority: Boolean(t.priority) });
    setTripVideoId(t.videoId || null);
    setTripVideo(null);
  setReplacedImages({});
  setRemovedImageIndices([]);
    // load stops for trip
    if (TRIP_STOPS_COLLECTION_ID) {
      try {
        const res = await databases.listDocuments(DB_ID, TRIP_STOPS_COLLECTION_ID, [
          // order not required but helpful
        ]);
        const mine = (res.documents || [])
          .filter((s) => s.tripId === t.$id)
          .map((s) => ({
            id: s.$id,
            name: s.name,
            description: s.description,
            imageId: s.imageId,
            images: Array.isArray(s.images) ? s.images : (s.imageId ? [s.imageId] : []),
            videoId: s.videoId || null,
          }));
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
        <button onClick={() => setTab('services')} className={`px-3 py-1 rounded ${tab === 'services' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Services</button>
        <button onClick={() => setTab('sections')} className={`px-3 py-1 rounded ${tab === 'sections' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Sections</button>
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
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">{t.title}</div>
                        {t.priority && <div className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">PRIORITY</div>}
                      </div>
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

              <div className="flex items-center gap-2">
                <input id="priority" type="checkbox" checked={!!form.priority} onChange={(e) => setForm({ ...form, priority: e.target.checked })} />
                <label htmlFor="priority" className="text-sm">Priority (feature on Home page)</label>
              </div>

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
                      <textarea placeholder="Extra details (visible on stop details page)" value={st.extraDetails || ''} onChange={(e) => updateStop(idx, { extraDetails: e.target.value })} className="w-full mb-1 p-1 border rounded" />
                      <div className="mb-2">
                        <label className="text-sm">Stop images (you can add multiple):</label>
                        <input type="file" accept="image/*" multiple onChange={(e) => addFilesToStop(idx, e.target.files)} />
                      </div>
                      <div className="mb-2">
                        <label className="text-sm">Stop video (optional):</label>
                        <input type="file" accept="video/*" onChange={(e) => setVideoForStop(idx, e.target.files?.[0] || null)} />
            {(st.video || st.videoId) && (
                          <div className="mt-2">
              <video src={st.video ? URL.createObjectURL(st.video) : (st.videoId ? getStopVideoUrl(st.videoId) : '')} className="w-full max-h-40" controls />
                            <button type="button" onClick={() => clearVideoForStop(idx)} className="text-xs mt-1 px-2 py-1 bg-red-100 rounded">Remove video</button>
                          </div>
                        )}
                      </div>
                      {st.images && st.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          {st.images.map((img, i) => (
                            <div key={i} className="relative border rounded overflow-hidden">
                              <img src={typeof img === 'string' ? getStopImageUrl(img) : URL.createObjectURL(img)} className="w-full h-20 object-cover" alt={`stop-${i}`} />
                              <button type="button" onClick={() => removeImageFromStop(idx, i)} className="absolute top-1 right-1 bg-white/80 rounded px-1 text-red-600">x</button>
                            </div>
                          ))}
                        </div>
                      )}
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
                <div className="mt-2">
                  <label className="block text-sm font-medium mb-1">Trip video (optional)</label>
                  <input type="file" accept="video/*" onChange={(e) => { setTripVideo(e.target.files?.[0] || null); setTripVideoId(null); }} />
                  {(tripVideo || tripVideoId) && (
                    <div className="mt-2">
                      <video src={tripVideo ? URL.createObjectURL(tripVideo) : (tripVideoId ? getStopVideoUrl(tripVideoId) : '')} className="w-full max-h-40" controls />
                      <div className="flex gap-2 mt-1">
                        <button type="button" onClick={() => { setTripVideo(null); setTripVideoId(null); }} className="text-xs px-2 py-1 bg-red-100 rounded">Remove</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="bg-blue-600 text-white px-3 py-1 rounded">{saving ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => { setForm(emptyForm); setStops([]); setTripFiles([]); }} className="px-3 py-1 rounded bg-gray-100">Cancel</button>
              </div>
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

      {tab === 'services' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Services we provide</h2>
            <div>
              <button onClick={loadServices} className="mr-2 px-2 py-1 bg-gray-100 rounded">Refresh</button>
              <button onClick={() => setServiceForm({ id: null, title: '', description: '', imageFile: null, imageId: null, order: 0 })} className="px-2 py-1 bg-gray-100 rounded">New</button>
            </div>
          </div>
          {loadingServices ? <div>Loading services...</div> : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-2">
                <ul className="space-y-3">
                  {services.map((s) => (
                    <li key={s.id} className="border rounded p-3 flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{s.title}</div>
                        <div className="text-sm text-gray-600">{s.description?.slice(0, 120)}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => editService(s)} className="px-2 py-1 bg-yellow-100 rounded">Edit</button>
                        <button onClick={() => removeService(s.id)} className="px-2 py-1 bg-red-100 rounded">Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-1 bg-white rounded shadow p-4">
                <h3 className="font-semibold mb-2">Create / Edit Service</h3>
                <form onSubmit={saveService} className="space-y-2">
                  <input className="w-full border p-2 rounded" value={serviceForm.title} onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })} placeholder="Title" required />
                  <textarea className="w-full border p-2 rounded" value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} placeholder="Description" />
                  <div>
                    <label className="text-sm">Assign to Trip (optional)</label>
                    <select className="w-full border p-2 rounded" value={serviceForm.tripId || ''} onChange={(e) => setServiceForm({ ...serviceForm, tripId: e.target.value || null })}>
                      <option value="">-- Not associated with a trip --</option>
                      {trips.map((t) => (
                        <option key={t.$id} value={t.$id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => setServiceForm({ ...serviceForm, imageFile: e.target.files?.[0] || null })} />
                  <input type="number" className="w-full border p-2 rounded" value={serviceForm.order} onChange={(e) => setServiceForm({ ...serviceForm, order: Number(e.target.value || 0) })} placeholder="Order" />
                  <div className="flex gap-2">
                    <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
                    <button type="button" onClick={() => setServiceForm({ id: null, title: '', description: '', imageFile: null, imageId: null, order: 0 })} className="px-3 py-1 rounded bg-gray-100">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'sections' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Site Sections (editable)</h2>
            <div>
              <button onClick={loadSections} className="mr-2 px-2 py-1 bg-gray-100 rounded">Refresh</button>
              <button onClick={() => setSectionForm({ id: null, key: '', title: '', content: '', imageFile: null, imageId: null, order: 0 })} className="px-2 py-1 bg-gray-100 rounded">New</button>
            </div>
          </div>
          {loadingSections ? <div>Loading sections...</div> : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-2">
                <ul className="space-y-3">
                  {sections.map((s) => (
                    <li key={s.id} className="border rounded p-3 flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{s.title || s.key}</div>
                        <div className="text-sm text-gray-600">{(s.content || '').slice(0, 140)}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => editSection(s)} className="px-2 py-1 bg-yellow-100 rounded">Edit</button>
                        <button onClick={() => removeSection(s.id)} className="px-2 py-1 bg-red-100 rounded">Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-span-1 bg-white rounded shadow p-4">
                <h3 className="font-semibold mb-2">Create / Edit Section</h3>
                <form onSubmit={saveSection} className="space-y-2">
                  <input className="w-full border p-2 rounded" value={sectionForm.key} onChange={(e) => setSectionForm({ ...sectionForm, key: e.target.value })} placeholder="Key (unique)" />
                  <input className="w-full border p-2 rounded" value={sectionForm.title} onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })} placeholder="Title" />
                  <textarea className="w-full border p-2 rounded" value={sectionForm.content} onChange={(e) => setSectionForm({ ...sectionForm, content: e.target.value })} placeholder="Content (HTML or markdown)" rows={6} />
                  <input type="file" accept="image/*" onChange={(e) => setSectionForm({ ...sectionForm, imageFile: e.target.files?.[0] || null })} />
                  <input type="number" className="w-full border p-2 rounded" value={sectionForm.order} onChange={(e) => setSectionForm({ ...sectionForm, order: Number(e.target.value || 0) })} placeholder="Order" />
                  <div className="flex gap-2">
                    <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
                    <button type="button" onClick={() => setSectionForm({ id: null, key: '', title: '', content: '', imageFile: null, imageId: null, order: 0 })} className="px-3 py-1 rounded bg-gray-100">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
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
