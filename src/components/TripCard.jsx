import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getTripImageUrl } from '../services/trips';
import { useAuth } from '../context/auth';

export default function TripCard({ trip, onPay }) {
  const { user } = useAuth();
  const img = getTripImageUrl(trip.imageIds?.[0]);
  return (
    <div className="rounded-xl overflow-hidden shadow-md bg-white hover:shadow-xl transition-shadow duration-200">
      <div className="relative h-56 sm:h-48 lg:h-56">
        {img ? (
          <Link to={`/trips/${trip.id}`} className="block w-full h-full">
            <img loading="lazy" src={img} alt={trip.title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300" />
          </Link>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center">No Image</div>
        )}
        <div className="absolute top-3 right-3 bg-white/90 text-sm px-3 py-1 rounded-full font-semibold">₹{trip.price}</div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold leading-tight">
          <Link to={`/trips/${trip.id}`} className="hover:underline">{trip.title}</Link>
        </h3>
        <p className="text-sm text-gray-600 mt-1">{trip.date || 'Flexible dates'}</p>
        {Array.isArray(trip.stops) && trip.stops.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">Stops: {trip.stops.join(' → ')}</p>
        )}

        <div className="flex items-center justify-between mt-4">
          {user ? (
            <button onClick={() => onPay?.(trip)} className="bg-[#FD366E] hover:bg-[#e02f61] text-white px-4 py-2 rounded-md">Book Now</button>
          ) : (
            <Link to="/login" className="text-[#FD366E] font-medium">Login to book</Link>
          )}
          <Link to={`/trips/${trip.id}`} className="text-sm text-gray-500">Details →</Link>
        </div>
      </div>
    </div>
  );
}

TripCard.propTypes = {
  trip: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    date: PropTypes.string,
    imageIds: PropTypes.arrayOf(PropTypes.string),
    stops: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onPay: PropTypes.func,
};
