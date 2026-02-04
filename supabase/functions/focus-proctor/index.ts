import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AI_GATEWAY_URL = "https://ai-gateway.lovable.dev/observe/v1/chat/completions";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing webcam image for focus detection...');

    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an AI focus proctor for a study app. Analyze the webcam image to determine if the student appears to be studying or present at their desk.

Look for:
- Person visible and facing the screen/desk
- Signs of engagement (looking at screen, writing, reading)
- Study materials or laptop visible
- Person appears awake and attentive

Return a JSON object with these exact fields:
{
  "isStudying": boolean (true if person appears to be studying/focused),
  "confidence": number (0-100, how confident you are),
  "reason": string (brief explanation of your assessment),
  "tips": string (optional study tip if they seem distracted)
}

Be lenient - if the person is visible and seems to be at their desk, assume they're studying. Only mark isStudying as false if:
- No person visible
- Person clearly doing something else (phone, sleeping, away)
- Person appears very distracted`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              },
              {
                type: 'text',
                text: 'Analyze this webcam image. Is the student studying and focused? Return the JSON assessment.'
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      
      if (response.status === 429 || errorText.includes('RATE_LIMITED') || errorText.includes('CREDITS_EXHAUSTED')) {
        return new Response(
          JSON.stringify({ 
            error: 'AI credits exhausted. Please try again later.',
            isStudying: true, // Default to studying to not penalize
            confidence: 50,
            reason: 'AI unavailable - defaulting to studying'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI Response:', content);

    // Parse the JSON response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      // Default to studying if parsing fails
      result = {
        isStudying: true,
        confidence: 50,
        reason: 'Unable to analyze image clearly',
        tips: 'Keep up the good work!'
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in focus-proctor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        isStudying: true, // Default to studying on error
        confidence: 50,
        reason: 'Error during analysis'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});