import { GoogleGenerativeAI } from 'npm:@google/generative-ai@^0.24.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const CATEGORIES = ['Protein', 'Vegetable', 'Fruit', 'Grain', 'Oil', 'Fat', 'Dairy', 'Baking', 'Spice/Sauce', 'Pantry'];

// Units available per category group
const CATEGORY_UNITS: Record<string, string[]> = {
  Protein:      ['each', 'oz', 'lb', 'g', 'kg', 'piece', 'fillet', 'breast', 'slice'],
  Vegetable:    ['each', 'oz', 'lb', 'g', 'bunch', 'head', 'stalk', 'cup', 'handful'],
  Fruit:        ['each', 'oz', 'lb', 'g', 'cup', 'handful', 'bunch', 'slice'],
  Grain:        ['cup', 'oz', 'lb', 'g', 'kg', 'tbsp', 'tsp', 'piece', 'slice'],
  Oil:          ['tbsp', 'tsp', 'cup', 'fl oz', 'ml', 'L'],
  Fat:          ['tbsp', 'tsp', 'cup', 'oz', 'lb', 'g', 'stick'],
  Dairy:        ['cup', 'fl oz', 'ml', 'oz', 'lb', 'g', 'tbsp', 'tsp', 'slice', 'each'],
  Baking:       ['cup', 'oz', 'lb', 'g', 'tbsp', 'tsp', 'each', 'pinch'],
  'Spice/Sauce':['tsp', 'tbsp', 'cup', 'oz', 'g', 'fl oz', 'ml', 'pinch', 'dash'],
  Pantry:       ['each', 'oz', 'lb', 'g', 'cup', 'tbsp', 'tsp', 'can', 'bottle', 'bag', 'fl oz', 'ml'],
};

// Units that are "universal" — global unit_conversions rows exist for these,
// so no ingredient-specific conversion row is needed
const UNIVERSAL_UNITS = new Set([
  'oz', 'lb', 'g', 'kg', 'cup', 'tbsp', 'tsp', 'fl oz', 'ml', 'L', 'stick', 'pinch', 'dash',
]);

const SYSTEM_PROMPT = `You are an ingredient classification assistant for a cooking pantry app.

Given an ingredient name, respond with ONLY a JSON object (no markdown, no extra text) with these fields:

{
  "category": one of [${CATEGORIES.map(c => `"${c}"`).join(', ')}],
  "preferred_unit": the most natural unit home cooks use for this ingredient (e.g. "each" for whole fruits/veg, "oz" for meats, "cup" for grains/liquids),
  "base_unit": the canonical measurement unit that conversions are expressed in (usually a weight like "g" or volume like "ml", or "each" for count-based items),
  "conversion_value": if preferred_unit is NOT a standard metric/imperial unit (i.e. it's something like "each", "bunch", "head", "fillet"), provide an estimated numeric value representing how many grams or ml 1 preferred_unit equals. If preferred_unit IS a standard unit (oz, lb, g, kg, cup, tbsp, tsp, fl oz, ml, L), set this to null,
  "conversion_to_unit": the unit that conversion_value converts to (usually "g" for solids, "ml" for liquids). Set to null if conversion_value is null.
}

Rules:
- Be practical — home pantry context, not restaurant
- For whole produce (apple, dragonfruit, onion), preferred_unit is usually "each"
- For meats/fish, preferred_unit is usually "oz" or "lb"
- For liquids (oils, sauces), preferred_unit is usually "tbsp" or "cup"
- For spices, preferred_unit is usually "tsp"
- For grains/flour, preferred_unit is usually "cup"
- Estimate conversion_value based on typical specimen weight (e.g. 1 apple ≈ 182g, 1 bunch basil ≈ 30g)
- Only provide conversion_value when preferred_unit is non-standard`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('AI_INGREDIENT_CLASSIFIER');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI_INGREDIENT_CLASSIFIER is not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { ingredient_name } = body as { ingredient_name: string };

    if (!ingredient_name?.trim()) {
      return new Response(
        JSON.stringify({ error: 'ingredient_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      `Classify this ingredient: "${ingredient_name.trim()}"`,
    ]);

    const rawText = result.response.text().trim();

    // Strip markdown code fences if present
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed: {
      category: string;
      preferred_unit: string;
      base_unit: string;
      conversion_value: number | null;
      conversion_to_unit: string | null;
    };

    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', raw: rawText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate category falls within known set; default to Pantry
    if (!CATEGORIES.includes(parsed.category)) {
      parsed.category = 'Pantry';
    }

    // Attach the valid units for the returned category
    const available_units = CATEGORY_UNITS[parsed.category] ?? CATEGORY_UNITS['Pantry'];

    // Determine whether this needs a custom conversion row
    const needs_custom_conversion = !UNIVERSAL_UNITS.has(parsed.preferred_unit);

    return new Response(
      JSON.stringify({
        category: parsed.category,
        preferred_unit: parsed.preferred_unit,
        base_unit: parsed.base_unit,
        conversion_value: parsed.conversion_value,
        conversion_to_unit: parsed.conversion_to_unit,
        available_units,
        needs_custom_conversion,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
