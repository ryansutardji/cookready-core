import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are CookReady's AI Chef, a warm, knowledgeable culinary assistant. You help users cook delicious meals using what they already have in their pantry.

Guidelines:
- Suggest recipes using ONLY ingredients available in the provided pantry snapshot
- All ingredient quantities must be in 0.5 unit increments (e.g. 0.5, 1.0, 1.5, 2.0)
- Use the same units already present in the pantry data
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

export async function POST(request: Request) {
  try {
    const apiKey = process.env.google_ai_api_key || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'GOOGLE_AI_API_KEY is not configured on the server.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message, history, pantryContext } = body as {
      message: string;
      history: { role: 'user' | 'model'; parts: string }[];
      pantryContext: string;
    };

    if (!message) {
      return Response.json({ error: 'message is required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' });

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
    let recipes = [];
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

    return Response.json({ text, recipes });
  } catch (err: any) {
    return Response.json(
      { error: err.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
