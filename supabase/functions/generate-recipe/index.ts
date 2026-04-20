import { GoogleGenerativeAI } from 'npm:@google/generative-ai@^0.24.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const SYSTEM_PROMPT = `You are CookReady's AI Chef, a warm, knowledgeable culinary assistant. You help users cook delicious meals using what they already have in their pantry.

Guidelines:
- Suggest recipes using ONLY ingredients available in the provided pantry snapshot
- All ingredient quantities must be in 0.5 unit increments (e.g. 0.5, 1.0, 1.5, 2.0)
- For ingredients in the "Spice/Sauce" category, ALWAYS express quantities in tsp, tbsp, or cups — choose whichever unit is most appropriate for the amount needed in the recipe (e.g. use tsp for small pinches, tbsp for moderate amounts, cups for larger quantities)
- For all other ingredients, use the same units already present in the pantry data
- If the unit for an ingredient is the same as (or redundant with) the ingredient name itself (e.g. unit is "onion" and ingredient is "Onion", or unit is "chicken breast" and ingredient is "Chicken Breast"), omit the unit entirely and set "unit" to an empty string "" — the quantity alone is sufficient
- Keep your tone warm, encouraging, and concise
- When suggesting recipes, always include a structured JSON block at the END of your response

When you suggest one or more recipes, append this exact JSON block after your message (no extra text after it):

\`\`\`json
{
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "One-sentence description",
      "servings": 2,
      "ingredients": [
        { "name": "exact_ingredient_name", "quantity": 1.5, "unit": "cup" }
      ],
      "instructions": [
        "Step 1 description",
        "Step 2 description"
      ]
    }
  ]
}
\`\`\`

Use the exact ingredient name from the pantry data for "name" fields so they can be matched when depleting stock. If the user is chatting and NOT asking for a recipe, respond conversationally without the JSON block.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_AI_API_KEY is not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { message, history, pantryContext } = body as {
      message: string;
      history: { role: 'user' | 'model'; parts: string }[];
      pantryContext: string;
    };

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const fullSystemMessage = `${SYSTEM_PROMPT}\n\n${pantryContext ?? 'The pantry is currently empty.'}`;

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: fullSystemMessage }],
        },
        {
          role: 'model',
          parts: [
            {
              text: "I'm your AI Chef! I can see your pantry and I'm ready to suggest delicious recipes. What would you like to cook today?",
            },
          ],
        },
        ...(history ?? []).map((h) => ({
          role: h.role,
          parts: [{ text: h.parts }],
        })),
      ],
    });

    const result = await chat.sendMessage(message);
    const rawText = result.response.text();

    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/);
    let recipes: unknown[] = [];
    let text = rawText;

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (Array.isArray(parsed.recipes)) recipes = parsed.recipes;
      } catch {
        // leave recipes empty on parse failure
      }
      text = rawText.replace(/```json[\s\S]*?```/, '').trim();
    }

    return new Response(
      JSON.stringify({ text, recipes }),
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
