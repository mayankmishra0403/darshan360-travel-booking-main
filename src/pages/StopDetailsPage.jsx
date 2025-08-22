import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { getStop, getStopImageUrl, getStopVideoUrl } from '../services/trips';
import { useAuth } from '../context/auth';

export default function StopDetailsPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [stop, setStop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const isFirstRender = useRef(true);
  const pointerStartX = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await getStop(id);
        setStop(s);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Images (prefer new `images` array, fallback to single imageId)
  const images = Array.isArray(stop?.images) ? stop.images : (stop?.imageId ? [stop.imageId] : []);

  // Helpers to advance slides
  const next = useCallback(() => {
    setDirection(1);
    setIndex((i) => (i + 1) % Math.max(1, images.length));
    isFirstRender.current = false;
  }, [images.length]);
  const prev = useCallback(() => {
    setDirection(-1);
    setIndex((i) => (i - 1 + Math.max(1, images.length)) % Math.max(1, images.length));
    isFirstRender.current = false;
  }, [images.length]);

  // Reset index when images change (e.g., after load)
  useEffect(() => {
    setIndex(0);
    isFirstRender.current = true;
  }, [images.length]);

  // Keyboard navigation (left/right arrows)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // Pointer / touch swipe handlers
  const onPointerDown = (e) => {
    pointerStartX.current = e.clientX || (e.touches && e.touches[0]?.clientX) || null;
  };
  const onPointerUp = (e) => {
    const endX = e.clientX || (e.changedTouches && e.changedTouches[0]?.clientX) || null;
    if (pointerStartX.current == null || endX == null) return;
    const dx = endX - pointerStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx > 0) prev(); else next();
    }
    pointerStartX.current = null;
  };

  if (loading) return <div className="p-6">Loading stop...</div>;
  if (!stop) return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Stop not found</h2>
      <Link to="/">Back</Link>
    </div>
  );

  const currentImageId = images.length > 0 ? images[index] : null;
  const imageUrl = currentImageId ? getStopImageUrl(currentImageId, { full: false }) : '';
  const videoUrl = stop?.videoId ? getStopVideoUrl(stop.videoId) : '';

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <section className="relative h-80 md:h-96 rounded overflow-hidden bg-gray-200">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentImageId || 'empty'}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.45 }}
            className="absolute inset-0 flex items-center justify-center bg-black/10"
            onMouseDown={onPointerDown}
            onMouseUp={onPointerUp}
            onTouchStart={onPointerDown}
            onTouchEnd={onPointerUp}
          >
            {imageUrl ? (
              <img src={imageUrl} alt={stop.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">No image</div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />

        <div className="absolute bottom-3 left-3 z-20 text-white">
          <h2 className="text-lg font-bold">{stop.name}</h2>
        </div>

        <div className="absolute bottom-3 right-3 z-20 flex gap-2 items-center">
          <div className="text-sm mr-3 text-white/90">{images.length > 0 ? `${index + 1} / ${images.length}` : '0 / 0'}</div>
          <button onClick={prev} className="bg-white/20 text-white px-3 py-1 rounded">◀</button>
          <button onClick={next} className="bg-white/20 text-white px-3 py-1 rounded">▶</button>
        </div>
      </section>

      <div className="text-gray-700 my-4">{stop.description}</div>

      {/* Video (if present) */}
      {videoUrl && (
        <div className="my-6">
          <h3 className="text-lg font-semibold mb-2">Watch video</h3>
          <video
            controls
            src={videoUrl}
            className="w-full max-h-96 rounded-lg shadow-md"
          />
        </div>
      )}

      {/* Images gallery */}
      {images.length > 0 && (
        <div className="my-6">
          <h3 className="text-lg font-semibold mb-2">Photos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((imgId, i) => (
              <img
                key={i}
                src={getStopImageUrl(imgId, { full: false })}
                alt={`${stop.name} ${i + 1}`}
                className="w-full h-40 object-cover rounded-md shadow-sm"
              />
            ))}
          </div>
        </div>
      )}

      {/* More details: show only admin-provided `extraDetails` (no legacy fallbacks) */}
      {stop?.extraDetails && typeof stop.extraDetails === 'string' && stop.extraDetails.trim() && (
        <div className="my-6">
          <h3 className="text-lg font-semibold mb-2">More details</h3>
          <div className="prose max-w-none text-sm text-gray-700">
            {/* Render plain text while preserving line breaks (avoid injecting HTML) */}
            {stop.extraDetails.split('\n').map((line, i) => (
              <p key={i} className="mb-2 break-words">{line}</p>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link to={`/trips/${stop.tripId}`} className="text-blue-600 underline">Back to trip</Link>
        {isAdmin && (
          <Link to={`/admin?editStop=${stop.id}`} className="text-sm bg-orange-500 text-white px-3 py-1 rounded-md shadow">
            Edit in Admin panel
          </Link>
        )}
      </div>
    </div>
  );
}
