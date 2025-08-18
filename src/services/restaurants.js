// Example restaurants data for each place. Replace with API/database integration as needed.
export const restaurantsByPlace = {
  'Varanasi': [
    {
      name: 'Spice Villa',
      location: 'Godowlia, Varanasi',
      description: 'Authentic North Indian cuisine with a modern twist. Famous for thalis and lassi.',
      phone: '+91 9988776655',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Rooftop Cafe',
      location: 'Assi Ghat, Varanasi',
      description: 'Chill rooftop cafe with Ganga views, continental and local snacks.',
      phone: '+91 9876543211',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
    }
  ],
  'Prayagraj': [
    {
      name: 'Sangam Diner',
      location: 'Civil Lines, Prayagraj',
      description: 'Family restaurant serving Indian and Chinese cuisine. Known for quick service.',
      phone: '+91 9123456789',
      image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=400&q=80',
    }
  ]
};

export function getRestaurantsForPlace(placeName) {
  return restaurantsByPlace[placeName] || [];
}
