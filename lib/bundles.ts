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
  ingredients: BundleIngredient[];
};
