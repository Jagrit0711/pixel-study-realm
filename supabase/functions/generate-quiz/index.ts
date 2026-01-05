import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuizRequest {
  subject: string;
  chapter: string;
  taskType: string;
  difficultyTier: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, chapter, taskType, difficultyTier } = await req.json() as QuizRequest;

    console.log('Generating quiz for:', { subject, chapter, taskType, difficultyTier });

    const prompt = `Generate a 5-question multiple choice quiz to verify if a student has completed studying:

Subject: ${subject}
Chapter/Topic: ${chapter}
Task Type: ${taskType}
Difficulty: ${difficultyTier}

Create questions that test understanding, not just memorization. Questions should verify the student actually studied the material.

For ${difficultyTier} difficulty:
- Easy: Basic concept questions
- Medium: Application-based questions
- Hard: Analysis and problem-solving questions
- Very Hard: Advanced conceptual and numerical questions

IMPORTANT: Generate exactly 5 questions with 4 options each.

Respond in EXACTLY this JSON format (no markdown):
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    }
  ]
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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to generate quiz');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let quiz: { questions: QuizQuestion[] };
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      quiz = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse quiz:', content);
      throw new Error('Invalid quiz format');
    }

    if (!quiz.questions || quiz.questions.length !== 5) {
      throw new Error('Invalid number of questions');
    }

    console.log('Generated quiz with', quiz.questions.length, 'questions');

    return new Response(JSON.stringify(quiz), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate quiz';
    console.error('Error in generate-quiz function:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
