export type MeterSlot = {
  key: string;
  label: string;        // short label, e.g. for badges/summaries — keep existing short forms
  icon: string;          // emoji
  required: boolean;
  minCount: number;
  categories: string[];  // DB category values this slot counts
  question: string;      // shelf heading, e.g. "Any protein?"
  subhead: string;       // one-line body copy under the heading
  searchLabel: string;   // used in placeholder "Search a {searchLabel}…"
};

export const SHELVES: MeterSlot[] = [
  {
    key: 'protein', label: 'Protein', icon: '🥩', required: true, minCount: 1, categories: ['Protein'],
    question: 'Any protein?',
    subhead: "Chicken, eggs, beans, tofu — whatever's actually in there. One is plenty.",
    searchLabel: 'protein',
  },
  {
    key: 'vegetable', label: 'Veggie', icon: '🥦', required: true, minCount: 1, categories: ['Vegetable'],
    question: 'Any veggies?',
    subhead: "Onion, spinach, peppers, carrots — fresh, frozen, or canned all count. One is plenty.",
    searchLabel: 'veggie',
  },
  {
    key: 'grain', label: 'Grain', icon: '🌾', required: true, minCount: 1, categories: ['Grain'],
    question: 'Got a grain?',
    subhead: "Rice, pasta, bread, oats — the stuff that makes a meal filling. One is plenty.",
    searchLabel: 'grain',
  },
  {
    key: 'spice', label: 'Spice/Sauce', icon: '🌶️', required: true, minCount: 5, categories: ['Spice/Sauce'],
    question: 'The spice shelf',
    subhead: "This is the one that changes what I can cook. Five is my sweet spot — but two is better than none.",
    searchLabel: 'spice or sauce',
  },
  {
    key: 'oil', label: 'Oil', icon: '🫒', required: true, minCount: 1, categories: ['Oil', 'Fat'],
    question: 'Got an oil or fat?',
    subhead: "Olive oil, butter, vegetable oil — almost everything gets cooked in something. One is plenty.",
    searchLabel: 'oil',
  },
];

export const EXTRA_SLOTS: MeterSlot[] = [
  {
    key: 'fruit', label: 'Fruit', icon: '🍓', required: false, minCount: 1, categories: ['Fruit'],
    question: '', subhead: '', searchLabel: 'fruit', // question/subhead unused for extras — they only ever appear in the recap, never as their own shelf
  },
  {
    key: 'baking', label: 'Baking', icon: '🥣', required: false, minCount: 1, categories: ['Baking'],
    question: '', subhead: '', searchLabel: 'baking ingredient',
  },
];

export const ALL_SLOTS: MeterSlot[] = [...SHELVES, ...EXTRA_SLOTS];
