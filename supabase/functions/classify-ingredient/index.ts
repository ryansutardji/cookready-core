import { GoogleGenerativeAI } from 'npm:@google/generative-ai@^0.24.1';
import { createClient } from 'npm:@supabase/supabase-js@^2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const CATEGORIES = ['Protein', 'Vegetable', 'Fruit', 'Grain', 'Oil', 'Fat', 'Dairy', 'Baking', 'Spice/Sauce', 'Pantry'];

const UNIVERSAL_UNITS = new Set([
  'oz', 'lb', 'g', 'ml', 'cup', 'tbsp', 'tsp', 'pint', 'stick',
]);

async function fetchUnitsByCategory(): Promise<Record<string, string[]>> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const [ingResult, ucResult] = await Promise.all([
    supabase
      .from('ingredients')
      .select('category, base_unit, preferred_unit')
      .is('user_id', null),
    supabase
      .from('unit_conversions')
      .select('input_unit, ingredients!inner(category, user_id)')
      .is('ingredients.user_id', null),
  ]);

  const map: Record<string, Set<string>> = {};
  for (const row of ingResult.data ?? []) {
    if (!row.category) continue;
    if (!map[row.category]) map[row.category] = new Set();
    if (row.base_unit) map[row.category].add(row.base_unit);
    if (row.preferred_unit) map[row.category].add(row.preferred_unit);
  }
  for (const row of (ucResult.data ?? []) as any[]) {
    const cat = row.ingredients?.category;
    if (!cat) continue;
    if (!map[cat]) map[cat] = new Set();
    if (row.input_unit) map[cat].add(row.input_unit);
  }
  return Object.fromEntries(
    Object.entries(map).map(([cat, set]) => [cat, Array.from(set).sort()])
  );
}

function buildSystemPrompt(category: string, categoryUnits: string[]): string {
  const unitList = categoryUnits.map(u => `"${u}"`).join(', ');
  return `You are an ingredient classification assistant for a cooking pantry app.

Given an ingredient name in the category "${category}", respond with ONLY a JSON object (no markdown, no extra text) with these fields:

{
  "category": "${category}",
  "preferred_unit": the most natural unit home cooks use for this ingredient. MUST be one of: [${unitList}],
  "base_unit": the canonical measurement unit that conversions are expressed in. MUST also be one of: [${unitList}],
  "conversion_value": if preferred_unit is NOT a standard metric/imperial unit (i.e. not g, ml, oz, lb, cup, tbsp, tsp, pint, stick), provide an estimated numeric value for how many grams or ml 1 preferred_unit equals. Otherwise set to null,
  "conversion_to_unit": the unit that conversion_value converts to (usually "g" for solids, "ml" for liquids). Set to null if conversion_value is null.
}

Rules:
- preferred_unit and base_unit MUST be chosen from the provided unit list — never invent new units
- Be practical — home pantry context, not restaurant
- Estimate conversion_value based on typical specimen weight (e.g. 1 bunch basil ≈ 30g)
- Only provide conversion_value when preferred_unit is non-standard`;
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
    const { ingredient_name } = body as { ingredient_name: string };

    if (!ingredient_name?.trim()) {
      return new Response(
        JSON.stringify({ error: 'ingredient_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch valid units per category live from the DB
    const unitsByCategory = await fetchUnitsByCategory();
    const allUnits = Array.from(new Set(Object.values(unitsByCategory).flat())).sort();

    // First pass: determine category
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const categoryPrompt = `You are an ingredient classifier. Given an ingredient name, respond with ONLY a JSON object with one field:
{"category": one of [${CATEGORIES.map(c => `"${c}"`).join(', ')}]}
Classify: "${ingredient_name.trim()}"`;

    const catResult = await model.generateContent(categoryPrompt);
    const catRaw = catResult.response.text().trim()
      .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let detectedCategory = 'Pantry';
    try {
      const catParsed = JSON.parse(catRaw);
      if (CATEGORIES.includes(catParsed.category)) {
        detectedCategory = catParsed.category;
      }
    } catch { /* fall back to Pantry */ }

    // Use the category's specific unit set; fall back to all units
    const categoryUnits = unitsByCategory[detectedCategory] ?? allUnits;

    // Second pass: classify with category-constrained unit list
    const result = await model.generateContent([
      buildSystemPrompt(detectedCategory, categoryUnits),
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

    parsed.category = detectedCategory;

    // Clamp units to the valid set for safety
    const validSet = new Set(categoryUnits);
    if (!validSet.has(parsed.preferred_unit)) parsed.preferred_unit = categoryUnits[0] ?? 'g';
    if (!validSet.has(parsed.base_unit)) parsed.base_unit = parsed.preferred_unit;

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
