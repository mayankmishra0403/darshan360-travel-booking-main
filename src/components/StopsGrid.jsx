import PropTypes from 'prop-types';
import './StopsGrid.css';
import { getStopImageUrl } from '../services/trips';
import { Link } from 'react-router-dom';

const StopCard = ({ stop }) => {
  const img = stop?.imageId ? getStopImageUrl(stop.imageId, { full: false }) : '';
  return (
    <div className="stop-card">
      <div className="stop-image-wrap">
        {img ? (
          <img src={img} alt={stop.name} className="stop-image" onError={(e) => { e.currentTarget.src = '/react.svg'; }} />
        ) : (
          <div className="stop-image placeholder" />
        )}
        <div className="stop-overlay">
          <div className="stop-title">{stop.name}</div>
          <Link to={`/stops/${stop.id}`} className="stop-arrow-box" title="Open stop details">
            <span className="stop-arrow">➜</span>
          </Link>
        </div>
      </div>
      {stop.description && <div className="stop-desc">{stop.description}</div>}
    </div>
  );
};

const StopsGrid = ({ stops }) => (
  <section className="stops-grid-section my-6">
    <h2 className="stops-title">Places we visited</h2>
    <div className="stops-grid">
      {stops.map((s) => (
        <StopCard key={s.id} stop={s} />
      ))}
    </div>
  </section>
);

StopsGrid.propTypes = {
  stops: PropTypes.array.isRequired,
};

StopCard.propTypes = {
  stop: PropTypes.shape({
  id: PropTypes.string,
  tripId: PropTypes.string,
  name: PropTypes.string,
  description: PropTypes.string,
  imageId: PropTypes.string,
  }).isRequired,
};

export default StopsGrid;
