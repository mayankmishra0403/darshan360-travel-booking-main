import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import './PlaceAmenities.css';

const PlaceAmenities = ({ hotels, restaurants, foods }) => (
  <div className="place-amenities-section">
    <motion.h2 className="amenities-title" initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} transition={{duration:0.6}}>Hotels & Restaurants</motion.h2>
    <div className="amenities-grid">
      <div className="amenity-block">
        <motion.h3 className="amenity-heading" initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay:0.2}}>Hotels</motion.h3>
        {hotels && hotels.length ? hotels.map((h, i) => (
          <motion.div className="amenity-card hotel-card" key={i} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.25+i*0.08}}>
            <img src={h.image} alt={h.name} className="amenity-img" />
            <div className="amenity-info">
              <div className="amenity-title">{h.name}</div>
              <div className="amenity-desc">{h.description}</div>
              <div className="amenity-contact">Manager: {h.manager} | <a href={`tel:${h.phone}`}>{h.phone}</a></div>
              <div className="amenity-location">{h.location}</div>
            </div>
          </motion.div>
        )) : <div className="amenity-none">No hotels listed.</div>}
      </div>
      <div className="amenity-block">
        <motion.h3 className="amenity-heading" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay:0.2}}>Restaurants</motion.h3>
        {restaurants && restaurants.length ? restaurants.map((r, i) => (
          <motion.div className="amenity-card restaurant-card" key={i} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.25+i*0.08}}>
            <img src={r.image} alt={r.name} className="amenity-img" />
            <div className="amenity-info">
              <div className="amenity-title">{r.name}</div>
              <div className="amenity-desc">{r.description}</div>
              <div className="amenity-contact">Contact: <a href={`tel:${r.phone}`}>{r.phone}</a></div>
              <div className="amenity-location">{r.location}</div>
            </div>
          </motion.div>
        )) : <div className="amenity-none">No restaurants listed.</div>}
      </div>
    </div>
    <div className="food-section">
      <motion.h3 className="amenity-heading" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.3}}>Popular Foods</motion.h3>
      <div className="food-grid">
        {foods && foods.length ? foods.map((f, i) => (
          <motion.div className="food-card" key={i} initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} transition={{delay:0.35+i*0.07}}>
            <img src={f.image} alt={f.name} className="food-img" />
            <div className="food-info">
              <div className="food-title">{f.name}</div>
              <div className="food-desc">{f.description}</div>
            </div>
          </motion.div>
        )) : <div className="amenity-none">No food items listed.</div>}
      </div>
    </div>
  </div>
);

PlaceAmenities.propTypes = {
  hotels: PropTypes.array,
  restaurants: PropTypes.array,
  foods: PropTypes.array,
};

export default PlaceAmenities;
