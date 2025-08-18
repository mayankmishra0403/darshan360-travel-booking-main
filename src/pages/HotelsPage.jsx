
import React from 'react';
import PageTransition from '../components/PageTransition';
import HotelSection from '../components/HotelSection';
import { hotelsByPlace } from '../services/hotels';
import { useLocation } from 'react-router-dom';

const HotelsPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const place = params.get('place');
  let hotelsToShow = hotelsByPlace;
  let filtered = false;
  if (place && hotelsByPlace[place]) {
    hotelsToShow = { [place]: hotelsByPlace[place] };
    filtered = true;
  }
  return (
    <PageTransition>
      <div className="hotels-page-container">
        <h1 className="hotels-page-title">{filtered ? `Hotels in ${place}` : 'All Hotels'}</h1>
        {Object.entries(hotelsToShow).map(([p, hotels]) => (
          <div key={p} className="hotels-place-block">
            <h2 className="hotels-place-title">{p}</h2>
            <HotelSection hotels={hotels} />
          </div>
        ))}
        {filtered && (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <a href="/hotels" className="hotel-cta-btn" style={{ display: 'inline-block', minWidth: 180 }}>View All Hotels</a>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default HotelsPage;
