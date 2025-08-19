// Example hotels data for each place. Replace with API/database integration as needed.
export const hotelsByPlace = {
  'Varanasi': [
    {
      name: 'Ganga View Hotel',
      location: 'Dashashwamedh Ghat, Varanasi',
      description: 'A riverside hotel with beautiful views of the Ganges and easy access to the ghats.',
      features: ['Free WiFi', 'Breakfast Included', 'Rooftop Restaurant', 'Airport Shuttle'],
      manager: {
        name: 'Amit Singh',
        phone: '+91 9876543210',
        email: 'amit.singh@gangaview.com',
      }
    },
    {
      name: 'Heritage Palace',
      location: 'Assi Ghat, Varanasi',
      description: 'Experience royal hospitality in the heart of Varanasi with modern amenities.',
      features: ['Spa', 'Swimming Pool', 'Cultural Events', 'Free Parking'],
      manager: {
        name: 'Priya Sharma',
        phone: '+91 9123456780',
        email: 'priya.sharma@heritagepalace.com',
      }
    }
  ],
  'Prayagraj': [
    {
      name: 'Sangam Residency',
      location: 'Near Triveni Sangam, Prayagraj',
      description: 'Comfortable stay near the holy confluence with all modern facilities.',
      features: ['Conference Hall', '24/7 Room Service', 'River View', 'Laundry Service'],
      manager: {
        name: 'Ravi Verma',
        phone: '+91 9988776655',
        email: 'ravi.verma@sangamresidency.com',
      }
    }
  ]
};

export function getHotelsForPlace(placeName) {
  return hotelsByPlace[placeName] || [];
}
