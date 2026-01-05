import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DifficultyRequest {
  subject: string;
  chapter: string;
  taskType: 'reading' | 'problem-solving' | 'revision' | 'practice' | 'test-prep';
  examName?: string;
  examDate?: string;
  board?: string;
}

interface DifficultyResponse {
  tier: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  score: number;
  points: number;
  justification: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, chapter, taskType, examName, examDate, board } = await req.json() as DifficultyRequest;

    console.log('Analyzing difficulty for:', { subject, chapter, taskType, examName, examDate, board });

    // Calculate days until exam
    let daysUntilExam = null;
    if (examDate) {
      const examDateTime = new Date(examDate);
      const now = new Date();
      daysUntilExam = Math.ceil((examDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    const prompt = `You are an expert academic difficulty analyzer for Indian school/competitive exam students. 

Analyze the following study task and provide a difficulty assessment:

Subject: ${subject}
Chapter/Topic: ${chapter}
Task Type: ${taskType}
${examName ? `Exam: ${examName}` : ''}
${board ? `Board/Syllabus: ${board}` : ''}
${daysUntilExam !== null ? `Days until exam: ${daysUntilExam}` : ''}

Consider these factors:
1. Conceptual complexity of the subject and chapter
2. Typical difficulty for students at this level
3. Task type difficulty (problem-solving > practice > test-prep > revision > reading)
4. Exam proximity pressure (closer = more urgent = harder mentally)
5. Subject-specific factors (Physics/Math typically harder than English/History)

IMPORTANT: Be strict and accurate. Physics chapters like mechanics, electromagnetism are harder than English grammar. JEE/NEET topics are harder than board exam topics.

Respond in EXACTLY this JSON format (no markdown, no explanation):
{
  "tier": "Easy|Medium|Hard|Very Hard",
  "score": <number 1-100>,
  "points": <number based on difficulty: Easy=10-25, Medium=25-50, Hard=50-80, Very Hard=80-120>,
  "justification": "<2-3 sentences explaining the difficulty rating>"
}`;

    // Use Lovable AI Gateway with Gemini
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not found');
      throw new Error('AI service not configured. Please enable Lovable AI.');
    }

    const response = await fetch('https://ai.lovable.dev/v1/chat/completions', {
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
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', data);

    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    let difficulty: DifficultyResponse;
    try {
      // Clean up the response if it has markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      difficulty = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('AI returned invalid format. Please try again.');
    }

    // Validate the response
    if (!['Easy', 'Medium', 'Hard', 'Very Hard'].includes(difficulty.tier)) {
      throw new Error('Invalid difficulty tier from AI');
    }
    if (typeof difficulty.score !== 'number' || difficulty.score < 1 || difficulty.score > 100) {
      throw new Error('Invalid difficulty score from AI');
    }
    if (typeof difficulty.points !== 'number' || difficulty.points < 1) {
      throw new Error('Invalid points from AI');
    }

    console.log('Difficulty analysis result:', difficulty);

    return new Response(JSON.stringify(difficulty), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze difficulty';
    console.error('Error in analyze-difficulty function:', error);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'AI analysis is required. Task cannot be created without difficulty scoring.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
