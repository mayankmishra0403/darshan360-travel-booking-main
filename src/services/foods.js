// Example foods data for each place. Replace with API/database integration as needed.
export const foodsByPlace = {
  'Varanasi': [
    {
      name: 'Kachori Sabzi',
      description: 'Crispy kachoris served with spicy potato curry, a Varanasi breakfast staple.',
      image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Banarasi Paan',
      description: 'Iconic sweet paan with a burst of flavors, a must-try after meals.',
      image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80',
    }
  ],
  'Prayagraj': [
    {
      name: 'Chaat',
      description: 'Tangy and spicy street food, a favorite among locals and tourists alike.',
      image: 'https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?auto=format&fit=crop&w=400&q=80',
    }
  ]
};

export function getFoodsForPlace(placeName) {
  return foodsByPlace[placeName] || [];
}
