export type BundleIngredient = {
  ingredientId: string;
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
  // Null when the bundle mixes ingredients from more than one category;
  // set only when every ingredient in the bundle shares one category.
  primaryCategory: string | null;
  ingredients: BundleIngredient[];
};
