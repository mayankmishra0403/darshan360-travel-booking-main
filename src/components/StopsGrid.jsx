import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { getStopImageUrl } from '../services/trips';
import './StopsGrid.css';

export default function StopsGrid({ stops }) {
  if (!stops || stops.length === 0) return null;
  return (
    <section className="stops-grid-section">
      <motion.h2 className="stops-title" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>Places we visited</motion.h2>
      <div className="stops-grid">
        {stops.map((s) => (
          <motion.div key={s.id || s.name} className="stop-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="stop-image-wrap">
              <img src={getStopImageUrl(s.imageId)} alt={s.name} className="stop-image" />
            </div>
            <div className="stop-body">
              <div className="stop-name">{s.name}</div>
              <div className="stop-desc">{s.description || 'No description provided'}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

StopsGrid.propTypes = {
  stops: PropTypes.array,
};
