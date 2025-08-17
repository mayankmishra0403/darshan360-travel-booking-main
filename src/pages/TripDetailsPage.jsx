import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTrip, getTripImageUrls, getStopImageUrl, listStopsByTrip } from '../services/trips';

export default function TripDetailsPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const t = await getTrip(id);
        setTrip(t);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const [stops, setStops] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        if (trip?.id) {
          const s = await listStopsByTrip(trip.id);
          setStops(s);
        }
      } catch (e) { console.error(e); }
    })();
  }, [trip?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-gray-600 text-lg">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip not found</h2>
          <p className="text-gray-600 mb-6">This adventure seems to have wandered off the map</p>
          <Link 
            to="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Explore Other Trips
          </Link>
        </div>
      </div>
    );
  }

  const imgs = getTripImageUrls(trip.imageIds);

  // Build slides: first slide is the Trip hero; remaining slides are stops
  const heroImageId = Array.isArray(trip.imageIds) && trip.imageIds.length > 0 ? trip.imageIds[0] : null;
  const slides = [
    {
      kind: 'trip',
      title: trip.title,
      description: trip.description || `Experience ${stops.length} amazing destinations on this journey`,
      imageId: heroImageId,
      isMainSlide: true,
    },
    ...stops.map((s) => ({
      kind: 'stop',
      title: s.name,
      description: s.description,
      imageId: s.imageId,
      isMainSlide: false,
    })),
  ];

  const current = slides[index] || null;

  const next = () => setIndex((i) => (i + 1) % Math.max(1, slides.length));
  const prev = () => setIndex((i) => (i - 1 + Math.max(1, slides.length)) % Math.max(1, slides.length));

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Full-bleed background slider */}
      <section className="relative h-[60vh] sm:h-[70vh] rounded-2xl overflow-hidden shadow-md">
        {/* Background */}
        {current?.imageId ? (
          <img
            src={getStopImageUrl(current.imageId)}
            alt={current?.title || trip.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : imgs[0] ? (
          <img
            src={imgs[0]}
            alt={trip.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />

        {/* Content overlay */}
        <div className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-10 text-white">
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-wide opacity-80 mb-1">
              {current?.kind === 'trip' ? 'Trip' : 'Stop'}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight drop-shadow">
              {current?.title || trip.title}
            </h1>
            {current?.description && (
              <p className="mt-2 text-sm sm:text-base opacity-95">
                {current.description}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-between">
            <button onClick={prev} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full">
              ◀ Prev
            </button>
            <div className="text-sm opacity-90">
              {slides.length > 0 ? `${index + 1} / ${slides.length}` : '0 / 0'}
            </div>
            <button onClick={next} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full">
              Next ▶
            </button>
          </div>
        </div>
      </section>

      {/* Basic trip meta under the slider */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="bg-white rounded-lg p-4 shadow border"><span className="font-semibold">Trip:</span> {trip.title}</div>
        <div className="bg-white rounded-lg p-4 shadow border"><span className="font-semibold">Date:</span> {trip.date || 'Flexible'}</div>
        <div className="bg-white rounded-lg p-4 shadow border"><span className="font-semibold">Price:</span> ₹{trip.price}</div>
      </div>
    </div>
  );
}
