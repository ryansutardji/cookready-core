import { GoogleGenerativeAI } from 'npm:@google/generative-ai@^0.24.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const CATEGORIES = ['Protein', 'Vegetable', 'Fruit', 'Grain', 'Oil', 'Fat', 'Dairy', 'Baking', 'Spice/Sauce', 'Pantry'];

// Per-category units derived from DB (base_unit + preferred_unit of universal ingredients + their unit_conversion input_units)
const CATEGORY_UNITS: Record<string, string[]> = {
  Baking:        ['bag', 'bar', 'bottle', 'box', 'can', 'container', 'cup', 'g', 'jar', 'ml', 'packet', 'tbsp', 'tsp'],
  Dairy:         ['bag', 'ball', 'block', 'bottle', 'can', 'carton', 'container', 'count', 'g', 'log', 'ml', 'pack', 'stick', 'tub', 'wedge', 'wheel'],
  Fat:           ['block', 'g', 'jar', 'tub'],
  Fruit:         ['apple', 'bag', 'banana', 'box', 'container', 'count', 'g', 'mango', 'peach', 'pear', 'unit'],
  Grain:         ['bag', 'box', 'bundle', 'container', 'cup', 'g', 'pack'],
  Oil:           ['bottle', 'jar', 'large_bottle', 'ml'],
  Protein:       ['count', 'dozen', 'g', 'lb'],
  'Spice/Sauce': ['bag', 'bottle', 'box', 'can', 'container', 'g', 'jar', 'leaf', 'ml', 'packet', 'tbsp', 'tsp', 'tub'],
  Vegetable:     ['bag', 'bulb', 'bunch', 'carrot', 'clove', 'container', 'count', 'ear', 'g', 'head', 'knob', 'onion', 'pepper', 'pint', 'potato', 'shallot', 'stalk', 'tomato', 'unit'],
  Pantry:        ['bag', 'bar', 'bottle', 'box', 'can', 'container', 'count', 'g', 'jar', 'ml', 'pack', 'packet', 'tub'],
};

// Units that exist in the DB as base_unit or preferred_unit on universal ingredients,
// or as input_unit in unit_conversions — kept in sync with the DB.
const UNIVERSAL_UNITS = new Set([
  'oz', 'lb', 'g', 'ml', 'cup', 'tbsp', 'tsp', 'pint', 'stick',
]);

function buildSystemPrompt(validUnits: string[]): string {
  const unitList = validUnits.map(u => `"${u}"`).join(', ');
  return `You are an ingredient classification assistant for a cooking pantry app.

Given an ingredient name, respond with ONLY a JSON object (no markdown, no extra text) with these fields:

{
  "category": one of [${CATEGORIES.map(c => `"${c}"`).join(', ')}],
  "preferred_unit": the most natural unit home cooks use for this ingredient. MUST be one of: [${unitList}],
  "base_unit": the canonical measurement unit that conversions are expressed in. MUST also be one of: [${unitList}],
  "conversion_value": if preferred_unit is NOT a standard metric/imperial unit (i.e. not oz, lb, g, ml, cup, tbsp, tsp, pint, stick), provide an estimated numeric value representing how many grams or ml 1 preferred_unit equals. Otherwise set to null,
  "conversion_to_unit": the unit that conversion_value converts to (usually "g" for solids, "ml" for liquids). Set to null if conversion_value is null.
}

Rules:
- preferred_unit and base_unit MUST be chosen from the provided unit list — never invent new units
- Be practical — home pantry context, not restaurant
- For whole produce, preferred_unit is usually "count" or the ingredient's own name unit if present in the list
- For meats/fish, preferred_unit is usually "oz" or "lb"
- For liquids (oils, sauces), preferred_unit is usually "tbsp" or "cup"
- For spices, preferred_unit is usually "tsp"
- For grains/flour, preferred_unit is usually "cup"
- Estimate conversion_value based on typical specimen weight (e.g. 1 bunch basil ≈ 30g)
- Only provide conversion_value when preferred_unit is non-standard (not in the standard metric/imperial list above)`;
}

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
    const { ingredient_name, valid_units } = body as {
      ingredient_name: string;
      valid_units?: string[];
    };

    if (!ingredient_name?.trim()) {
      return new Response(
        JSON.stringify({ error: 'ingredient_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const units = valid_units && valid_units.length > 0 ? valid_units : [];

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent([
      buildSystemPrompt(units),
      `Classify this ingredient: "${ingredient_name.trim()}"`,
    ]);

    const rawText = result.response.text().trim();
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

    if (!CATEGORIES.includes(parsed.category)) {
      parsed.category = 'Pantry';
    }

    // Clamp preferred_unit to the valid set if provided
    const validSet = new Set(units);
    if (units.length > 0 && !validSet.has(parsed.preferred_unit)) {
      parsed.preferred_unit = units[0];
    }
    if (units.length > 0 && !validSet.has(parsed.base_unit)) {
      parsed.base_unit = parsed.preferred_unit;
    }

    const needs_custom_conversion = !UNIVERSAL_UNITS.has(parsed.preferred_unit);

    return new Response(
      JSON.stringify({
        category: parsed.category,
        preferred_unit: parsed.preferred_unit,
        base_unit: parsed.base_unit,
        conversion_value: parsed.conversion_value,
        conversion_to_unit: parsed.conversion_to_unit,
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
