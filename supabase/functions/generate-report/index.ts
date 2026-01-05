import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  tasksCompleted: number;
  tasksMissed: number;
  pointsEarned: number;
  pointsLost: number;
  totalTasks: number;
  streak: number;
  subjects: string[];
  avgDifficulty: string;
  reportType: 'daily' | 'weekly';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json() as ReportRequest;

    console.log('Generating report:', data);

    const prompt = `You are a brutally honest study coach. Generate a ${data.reportType} performance report.

Stats:
- Tasks Completed: ${data.tasksCompleted}/${data.totalTasks}
- Tasks Missed: ${data.tasksMissed}
- Points Earned: ${data.pointsEarned}
- Points Lost: ${data.pointsLost}
- Current Streak: ${data.streak} days
- Subjects Studied: ${data.subjects.join(', ') || 'None'}
- Average Difficulty: ${data.avgDifficulty}

Be brutally honest but constructive. No motivational fluff. Tell them exactly where they failed and what they need to do.

Generate 5 insight cards for a "wrapped" style report.

Respond in EXACTLY this JSON format (no markdown):
{
  "insights": [
    {
      "title": "Short catchy title",
      "value": "Key metric or stat",
      "description": "2-3 sentence brutal but helpful insight",
      "type": "positive|negative|neutral|warning"
    }
  ],
  "overallGrade": "A|B|C|D|F",
  "mainMessage": "One-line summary of their performance"
}`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
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
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate report');
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    
    let report;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      report = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse report:', content);
      throw new Error('Invalid report format');
    }

    console.log('Generated report:', report);

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
    console.error('Error in generate-report function:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
