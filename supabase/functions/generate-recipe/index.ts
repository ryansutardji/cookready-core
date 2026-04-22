import { GoogleGenerativeAI } from 'npm:@google/generative-ai@^0.24.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const SYSTEM_PROMPT = `You are CookReady's AI Chef, a warm, knowledgeable culinary assistant. You help users cook delicious meals using what they already have in their pantry.

### STRICT QUANTITY RULES
- You operate ONLY in increments of 0.5. 
- Every ingredient quantity MUST be a result of (Number * 0.5). 
- ACCEPTABLE: 0.5, 1.0, 1.5, 2.0, 2.5, etc.
- STRICTLY FORBIDDEN: 0.25, 0.3, 0.33, 0.75, or any other decimal.
- If a recipe would normally call for a smaller amount (like 0.25), you MUST round up to 0.5 or down to 0.0 (and exclude the ingredient). Never use a value between 0 and 0.5.

### UNIT LOGIC
- **Spices/Sauces:** Use tsp, tbsp, or cups.
- **Grains:** If whole (rice, quinoa, etc.), use "cups". If processed (pasta, noodles), use the pantry's preferred unit.
- **Redundancy Check:** If the unit name is the same as the ingredient (e.g., Unit: "Egg", Ingredient: "Egg"), set the unit to an empty string "".
- **All others:** Match the pantry snapshot units exactly.

### CONSTRAINTS & TONE
- Suggest recipes using ONLY ingredients in the provided pantry snapshot.
- Tone: Warm, encouraging, and concise.
- Off-topic: Politely decline non-cooking requests.
- Text Response: ONLY 1-3 sentences. No ingredient lists or instructions in the text (these are handled by the UI card).

### QUANTITY EXAMPLES FOR LOGIC:
- Pantry has 0.5 bunches Green Onion -> Recipe MUST use 0.5. (0.3 is forbidden).
- Pantry has 1.0 Onion -> Recipe can use 0.5 or 1.0.
- Pantry has 3.0 Chicken Breasts -> Recipe can use 0.5, 1.0, 1.5, 2.0, 2.5, or 3.0.
- For all other ingredients, use the same units already present in the pantry data

### RESPONSE RULES:
- If the unit for an ingredient is the same as (or redundant with) the ingredient name itself (e.g. unit is "onion" and ingredient is "Onion", or unit is "chicken breast" and ingredient is "Chicken Breast"), omit the unit entirely and set "unit" to an empty string "" — the quantity alone is sufficient
- Keep your tone warm, encouraging, and concise
- If the user's message is clearly unrelated to cooking, recipes, food, or ingredients (e.g. asking about weather, news, coding, math, general trivia, or any non-food topic), politely decline and explain that you are only able to help with recipes and cooking
- When you suggest a recipe, your TEXT response must ONLY contain a brief 1-3 sentence intro (e.g. the dish name and why it suits the request). Do NOT list ingredients, quantities, instructions, servings, or any recipe details in the text — all of that is displayed automatically in a recipe card below your message. Repeating recipe details in your text response is strictly forbidden.

ALWAYS end every response with this exact JSON block (no extra text after it):

\`\`\`json
{
  "off_topic": false,
  "recipes": []
}
\`\`\`

Rules for the JSON block:
- Set "off_topic" to true if the user's message is unrelated to cooking, food, or recipes; otherwise false
- When suggesting a recipe, put it in the "recipes" array using this shape:
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
- ALWAYS include exactly ONE recipe at a time. Numbers in a user's message do NOT mean they want multiple recipes — they may indicate serving size (e.g. "dinner for 6"), ingredient counts (e.g. "using 3 different vegetables"), cooking time, or other recipe parameters. Only treat a request as asking for multiple recipes if the user explicitly says something like "give me 3 recipes", "suggest a few recipes", or clearly lists multiple distinct dishes they want. In those cases, politely explain that you can only suggest one recipe per message and offer to suggest another after they've reviewed the current one. When a number refers to serving size or quantity, incorporate it directly into the recipe (e.g. scale the recipe to serve 6 people)
- If not suggesting any recipe, leave "recipes" as an empty array []
- Use the exact ingredient name from the pantry data for "name" fields so they can be matched when depleting stock`;

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

    const jsonMatches = [...rawText.matchAll(/```json\s*([\s\S]*?)```/g)];
    let recipes: unknown[] = [];
    let offTopic = false;
    let text = rawText;

    for (const jsonMatch of jsonMatches) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (typeof parsed === 'object' && parsed !== null && ('off_topic' in parsed || 'recipes' in parsed)) {
          if (Array.isArray(parsed.recipes)) recipes = parsed.recipes;
          if (parsed.off_topic === true) offTopic = true;
        }
      } catch {
        // skip unparseable blocks
      }
    }

    text = rawText.replace(/```json[\s\S]*?```/g, '').trim();

    return new Response(
      JSON.stringify({ text, recipes, offTopic }),
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
