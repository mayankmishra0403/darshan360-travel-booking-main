
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import './HotelSection.css';

const HotelSection = ({ hotels }) => {
  const [selectedManager, setSelectedManager] = useState(null);
  if (!hotels || hotels.length === 0) return null;

  return (
    <div className="hotel-section">
      <motion.h2 
        className="hotel-section-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >Hotels at this Place</motion.h2>
      <div className="hotel-cards-grid">
        {hotels.map((hotel, idx) => (
          <motion.div
            className="hotel-card"
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(80,80,200,0.13)' }}
          >
            <div className="hotel-card-header">
              <h3>{hotel.name}</h3>
              <span className="hotel-location">{hotel.location}</span>
            </div>
            <p className="hotel-description">{hotel.description}</p>
            <ul className="hotel-features">
              {hotel.features && hotel.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
            <button className="hotel-manager-btn" onClick={() => setSelectedManager(hotel.manager)}>
              <span role="img" aria-label="manager">👤</span> Manager Contact
            </button>
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {selectedManager && (
          <motion.div 
            className="hotel-manager-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="hotel-manager-modal-content">
              <button className="close-btn" onClick={() => setSelectedManager(null)}>&times;</button>
              <h4>Hotel Manager Contact</h4>
              <p><strong>Name:</strong> {selectedManager.name}</p>
              <p><strong>Phone:</strong> <a href={`tel:${selectedManager.phone}`}>{selectedManager.phone}</a></p>
              <p><strong>Email:</strong> <a href={`mailto:${selectedManager.email}`}>{selectedManager.email}</a></p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

HotelSection.propTypes = {
  hotels: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      location: PropTypes.string.isRequired,
      description: PropTypes.string,
      features: PropTypes.arrayOf(PropTypes.string),
      manager: PropTypes.shape({
        name: PropTypes.string,
        phone: PropTypes.string,
        email: PropTypes.string,
      })
    })
  )
};

export default HotelSection;
