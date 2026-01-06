import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RejectionRequest {
  rejectionReason: string;
  taskTitle: string;
  taskSubject: string;
  proofUrl?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rejectionReason, taskTitle, taskSubject, proofUrl } = await req.json() as RejectionRequest;

    console.log('Validating rejection:', { rejectionReason, taskTitle, taskSubject });

    const prompt = `You are a fair academic task verification reviewer. A squad member is trying to reject another member's proof of task completion.

Task Details:
- Title: ${taskTitle}
- Subject: ${taskSubject}
${proofUrl ? `- Proof URL provided: Yes` : '- Proof URL: Not accessible'}

Rejection Reason Given:
"${rejectionReason}"

Evaluate if this rejection is VALID and FAIR. A valid rejection must:
1. Be specific and objective (not vague like "looks wrong" or "I don't like it")
2. Relate to the actual task requirements (e.g., "proof shows only 5 questions, task required 15")
3. Not be petty, vindictive, or unreasonable
4. Point out genuine issues with the proof

Invalid rejections include:
- Personal grudges ("they didn't help me yesterday")
- Vague complaints ("doesn't look right")
- Unreasonable standards ("handwriting isn't neat enough")
- Irrelevant criticism ("they used pen instead of pencil")

Respond in EXACTLY this JSON format:
{
  "approved": true|false,
  "reasoning": "<1-2 sentences explaining why the rejection is valid/invalid>"
}`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not found');
      throw new Error('AI service not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again.');
      }
      throw new Error(`AI validation failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let result;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('AI returned invalid format');
    }

    console.log('Rejection validation result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to validate rejection';
    console.error('Error in validate-rejection function:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});