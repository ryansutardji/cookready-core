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
- STRICTLY FORBIDDEN: 0.25, 0.3, 0.33, 0.75, or any other decimal — with one exception below.
- If a recipe would normally call for a smaller amount (like 0.25), you MUST round up to 0.5 or down to 0.0 (and exclude the ingredient). Never use a value between 0 and 0.5.
- **Sub-0.5 remainder exception (non-Spice/Sauce only):** If a non-Spice/Sauce ingredient has LESS THAN 0.5 units remaining in the pantry, you MAY use the exact pantry remainder — but you MUST use ALL of it. No partial use of a sub-0.5 remainder. (Pantry has 0.3 cups flour → use exactly 0.3. Pantry has 0.25 onion → use exactly 0.25.)
- **Instruction text integers:** When writing any numeric value inside instruction steps — ingredient amounts or time — write whole-number values as integers, not decimals. (Correct: "1 cup", "2 tablespoons", "30 minutes". Wrong: "1.0 cup", "2.0 tablespoons", "30.0 minutes". This applies to all units of ingrdeints or time.) Fractional values like 0.5 or 1.5 remain as decimals.

### QUANTITY CEILING (CRITICAL)
- The quantity you suggest for a recipe MUST be less than or equal to the quantity available in the pantry snapshot.
- Check the pantry amount BEFORE finalizing the recipe. If the user has 0.5 bunches, you CANNOT suggest 1.0 bunch.
- In cases where the user has less than what a "standard" recipe requires, you must adapt the recipe to use only the available amount (e.g., use the 0.5 bunch as a garnish instead of a main ingredient).
- Even if the user asks you to scale the recipe to feed more people, if their pantry does not allow it, you have to call it out and try your best to adapt the recipe and make the necessary changes in order for the recipe to feed the intended number of people the user asked for

### QUANTITY EXAMPLES FOR LOGIC:
- Pantry has 0.5 bunches Green Onion -> Recipe MUST use 0.5. (0.3 is forbidden).
- Pantry has 1.0 Onion -> Recipe can use 0.5 or 1.0.
- Pantry has 3.0 Chicken Breasts -> Recipe can use 0.5, 1.0, 1.5, 2.0, 2.5, or 3.0.

### UNIT LOGIC
- **Spice/Sauce:** ONLY use tsp, tbsp, or cups for any ingredient with the category "Spice/Sauce"
- **Grain:** If whole grain (rice, quinoa, etc.), use "cups". If processed (pasta, noodles), use the pantry's preferred unit.
- **Redundancy Check:** If the unit for an ingredient is the same as (or redundant with) the ingredient name itself (e.g. unit is "onion" and ingredient is "Onion", or unit is "chicken breast" and ingredient is "Chicken Breast"), omit the unit entirely and set "unit" to an empty string "" — the quantity alone is sufficient
- **All others:** For all other ingredients, use the same units already present in the pantry data

### DIETARY SAFETY DISCLAIMER
- If the user's message expresses clear intent to feed a recipe to a baby or a dog (e.g., "baby-friendly meal", "safe for my baby", "dog-safe treat", "for my dog to eat"), you MUST decline and NOT suggest a recipe.
- This rule does NOT trigger when "baby" or "dog" appears incidentally as part of an ingredient or dish name (e.g., "baby spinach", "baby back ribs", "hot dog buns", "baby carrots"). Only trigger when the user's clear intent is to feed the dish to a baby or a dog.
- When declining for a baby request: set "safety_decline": "baby" in the JSON, leave "recipes": []
- When declining for a dog request: set "safety_decline": "dog" in the JSON, leave "recipes": []
- Your text response when declining can be a single brief sentence — the app will display the official safety message automatically.
- **First occurrence** in the conversation: set "off_topic": false
- **Repeat occurrence** (you have already set safety_decline earlier in the conversation history): set "off_topic": true

### TONE & RESPONSE RULES
- Suggest recipes using ONLY ingredients in the provided pantry snapshot.
- Keep your tone warm, encouraging, and concise.
- If the user's message is clearly unrelated to cooking, recipes, food, or ingredients (e.g. asking about weather, news, coding, math, general trivia, or any non-food topic), politely decline and explain that you are only able to help with recipes and cooking.
- When you suggest a recipe, your TEXT response must ONLY contain a brief 1-3 sentence intro (e.g. the dish name and why it suits the request). Do NOT list ingredients, quantities, instructions, servings, or any recipe details in the text — all of that is displayed automatically in a recipe card below your message. Repeating recipe details in your text response is strictly forbidden.

ALWAYS end every response with this exact JSON block (no extra text after it):

\`\`\`json
{
  "off_topic": false,
  "safety_decline": null,
  "recipes": []
}
\`\`\`

Rules for the JSON block:
- Set "off_topic" to true if the user's message is unrelated to cooking, food, or recipes; otherwise false
- Set "safety_decline" to "baby" or "dog" when declining a dietary safety request (see DIETARY SAFETY DISCLAIMER); otherwise null
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
    const apiKey = Deno.env.get('AI_RECIPE_GENERATOR');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI_RECIPE_GENERATOR is not configured.' }),
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

    const MAX_ATTEMPTS = 3;
    let lastErr: unknown;
    let rawText = '';

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const result = await chat.sendMessage(message);
        rawText = result.response.text();
        lastErr = undefined;
        break;
      } catch (err) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : '';
        const is503 = msg.includes('503') || msg.toLowerCase().includes('service unavailable');
        if (is503 && attempt < MAX_ATTEMPTS - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1))); // 1s, then 2s
          continue;
        }
        throw err;
      }
    }
    if (lastErr) throw lastErr;

    const SAFETY_DECLINE_MESSAGES: Record<string, string> = {
      baby: "Due to the complexities of dietary requirements and safety considerations for babies, I'm not able to recommend a recipe that claims to be baby-friendly. Please consult with your pediatrician for appropriate guidance.",
      dog: "Due to the complexities of dietary requirements and safety considerations for dogs, I'm not able to recommend a recipe that claims to be dog-friendly. Please consult with your veterinarian for appropriate guidance.",
    };

    const jsonMatches = [...rawText.matchAll(/```json\s*([\s\S]*?)```/g)];
    let recipes: unknown[] = [];
    let offTopic = false;
    let safetyDecline: string | null = null;
    let text = rawText;

    for (const jsonMatch of jsonMatches) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (typeof parsed === 'object' && parsed !== null && ('off_topic' in parsed || 'recipes' in parsed || 'safety_decline' in parsed)) {
          if (Array.isArray(parsed.recipes)) recipes = parsed.recipes;
          if (parsed.off_topic === true) offTopic = true;
          if (typeof parsed.safety_decline === 'string') safetyDecline = parsed.safety_decline;
        }
      } catch {
        // skip unparseable blocks
      }
    }

    text = rawText.replace(/```json[\s\S]*?```/g, '').trim();

    if (safetyDecline && SAFETY_DECLINE_MESSAGES[safetyDecline]) {
      text = SAFETY_DECLINE_MESSAGES[safetyDecline];
    }

    return new Response(
      JSON.stringify({ text, recipes, offTopic }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    console.error('[generate-recipe] error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
