import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { getStopImageUrl } from '../services/trips';
import './StopsGrid.css';

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="20">No image</text></svg>';

export default function StopsGrid({ stops }) {
  if (!stops || stops.length === 0) return null;
  return (
    <section className="stops-grid-section">
      <motion.h2 className="stops-title" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>Places we visited</motion.h2>
      <div className="stops-grid">
        {stops.map((s) => {
          const url = getStopImageUrl(s.imageId);
          console.info('Stop image', s.id || s.name, 'imageId=', s.imageId, 'url=', url);
          return (
            <motion.div key={s.id || s.name} className="stop-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <div className="stop-image-wrap">
                <img
                  src={url || PLACEHOLDER}
                  alt={s.name}
                  className="stop-image"
                  onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                />
              </div>
              <div className="stop-body">
                <div className="stop-name">{s.name}</div>
                <div className="stop-desc">{s.description || 'No description provided'}</div>
                {url && (
                  <div className="mt-2">
                    <button onClick={() => window.open(url, '_blank')} className="open-image-btn">Open image</button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

StopsGrid.propTypes = {
  stops: PropTypes.array,
};
