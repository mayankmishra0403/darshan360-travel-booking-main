import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { getStopImageUrl } from '../services/trips';
import './StopsGrid.css';
import { useState } from 'react';

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="20">No image</text></svg>';

function StopCard({ stop }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  const url = getStopImageUrl(stop.imageId);
  // console debug
  console.info('Stop image', stop.id || stop.name, 'imageId=', stop.imageId, 'url=', url);

  return (
    <motion.div className="stop-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
      <div className="stop-image-container">
        {!loaded && !err && (
          <div className="stop-image-placeholder">
            <div className="loader">📷</div>
          </div>
        )}
        <img
          loading="lazy"
          src={!err && url ? url : PLACEHOLDER}
          alt={stop.name}
          className={`stop-image ${loaded ? 'loaded' : 'loading'}`}
          onLoad={() => setLoaded(true)}
          onError={(e) => { setErr(true); e.currentTarget.src = PLACEHOLDER; }}
        />
        <div className="stop-image-overlay">
          <div className="stop-title-overlay">{stop.name}</div>
        </div>
      </div>
      <div className="stop-body">
        <div className="stop-desc line-clamp-3">{stop.description || 'No description provided'}</div>
      </div>
    </motion.div>
  );
}

StopCard.propTypes = {
  stop: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    imageId: PropTypes.string,
  }).isRequired,
};

export default function StopsGrid({ stops }) {
  if (!stops || stops.length === 0) return null;
  return (
    <section className="stops-grid-section">
      <motion.h2 className="stops-title" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>Places we visited</motion.h2>
      <div className="stops-grid">
        {stops.map((s) => (
          <StopCard key={s.id || s.name} stop={s} />
        ))}
      </div>
    </section>
  );
}

StopsGrid.propTypes = {
  stops: PropTypes.array,
};
