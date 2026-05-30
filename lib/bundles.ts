export type BundleIngredient = {
  name: string;
  defaultUnit: string;
};

export type Bundle = {
  id: string;
  name: string;
  description: string;
  tag: string;
  icon: string;
  color: string;
  ingredients: BundleIngredient[];
};

export const BUNDLES: Bundle[] = [
  {
    id: 'seasoning-staples',
    name: 'Seasoning Staples',
    description: 'The spice rack every kitchen needs.',
    tag: 'Everyday',
    icon: '🧂',
    color: '#D2691E',
    ingredients: [
      { name: 'Salt', defaultUnit: 'container' },
      { name: 'Black Pepper (Ground)', defaultUnit: 'jar' },
      { name: 'Garlic Powder', defaultUnit: 'jar' },
      { name: 'Onion Powder', defaultUnit: 'jar' },
      { name: 'Paprika', defaultUnit: 'jar' },
      { name: 'Cumin (Ground)', defaultUnit: 'jar' },
    ],
  },
  {
    id: 'asian-flavors',
    name: 'Asian Flavors',
    description: 'Bold sauces and aromatics for Asian cooking.',
    tag: 'Cuisine',
    icon: '🥢',
    color: '#B8860B',
    ingredients: [
      { name: 'Soy Sauce', defaultUnit: 'bottle' },
      { name: 'Toasted Sesame Oil', defaultUnit: 'bottle' },
      { name: 'Rice Vinegar', defaultUnit: 'bottle' },
      { name: 'Mirin', defaultUnit: 'bottle' },
      { name: 'Hoisin Sauce', defaultUnit: 'bottle' },
      { name: 'Oyster Sauce', defaultUnit: 'bottle' },
      { name: 'Ginger (Ground)', defaultUnit: 'jar' },
      { name: 'Gochujang', defaultUnit: 'tub' },
    ],
  },
  {
    id: 'italian-pantry',
    name: 'Italian Pantry',
    description: 'Everything you need for classic Italian dishes.',
    tag: 'Cuisine',
    icon: '🍝',
    color: '#4A7A4A',
    ingredients: [
      { name: 'Extra Virgin Olive Oil', defaultUnit: 'bottle' },
      { name: 'Marinara Sauce', defaultUnit: 'jar' },
      { name: 'Tomato Paste', defaultUnit: 'can' },
      { name: 'Pesto', defaultUnit: 'jar' },
      { name: 'Dried Basil', defaultUnit: 'jar' },
      { name: 'Dried Oregano', defaultUnit: 'jar' },
      { name: 'Italian Seasoning', defaultUnit: 'jar' },
      { name: 'Dried Thyme', defaultUnit: 'jar' },
    ],
  },
  {
    id: 'baking-basics',
    name: 'Baking Basics',
    description: 'The essentials for any baking project.',
    tag: 'Project',
    icon: '🥣',
    color: '#8B5A2B',
    ingredients: [
      { name: 'All-Purpose Flour', defaultUnit: 'bag' },
      { name: 'Granulated Sugar', defaultUnit: 'bag' },
      { name: 'Baking Powder', defaultUnit: 'container' },
      { name: 'Baking Soda', defaultUnit: 'box' },
      { name: 'Vanilla Extract', defaultUnit: 'bottle' },
      { name: 'Vegetable Oil', defaultUnit: 'bottle' },
      { name: 'Cornstarch', defaultUnit: 'container' },
    ],
  },
  {
    id: 'mexican-staples',
    name: 'Mexican Staples',
    description: 'The foundation of a great Mexican pantry.',
    tag: 'Cuisine',
    icon: '🌶️',
    color: '#C2410C',
    ingredients: [
      { name: 'Chili Powder (Standard)', defaultUnit: 'jar' },
      { name: 'Smoked Paprika', defaultUnit: 'jar' },
      { name: 'Mexican Oregano (Dried)', defaultUnit: 'jar' },
      { name: 'Cumin Seeds', defaultUnit: 'jar' },
      { name: 'Chipotle in Adobo', defaultUnit: 'can' },
      { name: 'Dried Ancho Chile', defaultUnit: 'bag' },
      { name: 'Achiote Paste', defaultUnit: 'block' },
    ],
  },
  {
    id: 'mediterranean-mezze',
    name: 'Mediterranean Mezze',
    description: 'Bold flavors for dips, flatbreads, and spreads.',
    tag: 'Cuisine',
    icon: '🫒',
    color: '#5A7A5A',
    ingredients: [
      { name: 'Tahini', defaultUnit: 'jar' },
      { name: "Za'atar", defaultUnit: 'jar' },
      { name: 'Harissa', defaultUnit: 'jar' },
      { name: 'Preserved Lemon', defaultUnit: 'jar' },
      { name: 'Kalamata Olives', defaultUnit: 'jar' },
      { name: 'Capers', defaultUnit: 'jar' },
      { name: 'Sumac', defaultUnit: 'jar' },
    ],
  },
];
