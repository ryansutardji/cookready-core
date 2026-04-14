import { supabase } from './supabase';
import type { PantryItem } from './supabase';

export type RecipeIngredient = {
  name: string;
  quantity: number;
  unit: string;
};

export type Recipe = {
  name: string;
  description: string;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
};

export type GeminiResponse = {
  text: string;
  recipes: Recipe[];
};

export function buildPantryContext(items: PantryItem[]): string {
  if (items.length === 0) return 'The pantry is currently empty.';

  const grouped: Record<string, string[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(`  - ${item.name}: ${item.human_readable_inventory}`);
  }

  const lines = Object.entries(grouped).map(
    ([cat, entries]) => `${cat}:\n${entries.join('\n')}`
  );

  return `Current Pantry Inventory:\n\n${lines.join('\n\n')}`;
}

export async function sendChatMessage(
  history: { role: 'user' | 'model'; parts: string }[],
  newMessage: string,
  pantryItems: PantryItem[]
): Promise<GeminiResponse> {
  const pantryContext = buildPantryContext(pantryItems);

  console.log('Invoking generate-recipe edge function...');

  const { data, error } = await supabase.functions.invoke('generate-recipe', {
    body: { message: newMessage, history, pantryContext },
  });

  if (error) {
    console.error('Edge function error:', JSON.stringify(error));
    throw new Error(error.message ?? 'Edge function request failed');
  }

  if (!data) {
    throw new Error('Edge function returned no data');
  }

  return { text: data.text ?? '', recipes: data.recipes ?? [] };
}
