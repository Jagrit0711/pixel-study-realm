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
  classLevel?: string;
}

interface DifficultyResponse {
  tier: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  score: number;
  points: number;
  estimatedMinutes: number;
  justification: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, chapter, taskType, examName, examDate, board, classLevel } = await req.json() as DifficultyRequest;

    console.log('Analyzing difficulty for:', { subject, chapter, taskType, examName, examDate, board, classLevel });

    // Calculate days until exam
    let daysUntilExam = null;
    if (examDate) {
      const examDateTime = new Date(examDate);
      const now = new Date();
      daysUntilExam = Math.ceil((examDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    const prompt = `You are an expert academic advisor for Indian school/competitive exam students. Your job is to:
1. ESTIMATE THE TIME required for a study task
2. Calculate FAIR points based on time and difficulty

TASK DETAILS:
Subject: ${subject}
Chapter/Topic: ${chapter}
Task Type: ${taskType}
${examName ? `Exam: ${examName}` : ''}
${board ? `Board/Syllabus: ${board}` : ''}
${classLevel ? `Class: ${classLevel}` : ''}
${daysUntilExam !== null ? `Days until exam: ${daysUntilExam}` : ''}

## TIME ESTIMATION RULES:
You MUST estimate how long this task realistically takes. Consider:
- Reading a chapter: 30-60 min per average chapter
- Problem solving: 3-5 min per problem (more for complex)
- Revision: 20-40 min per chapter
- Practice questions: 2-4 min per question
- Test prep: Depends on scope

Examples:
- "Physics 15 integration problems" → 45-75 min (5 min each)
- "English entire syllabus revision" → 180-240 min (3-4 hours)
- "Accounts balance sheet chapter" → 60-90 min
- "History one chapter reading" → 30-45 min
- "Math JEE calculus 2 hour practice" → 120 min

## POINTS CALCULATION:
Points are based on TIME SPENT (primary) + DIFFICULTY ADJUSTMENT.

Base formula: points = estimatedMinutes × difficulty_multiplier

Difficulty multipliers (ALL SUBJECTS TREATED FAIRLY):
- Easy tasks: 0.8-1.0x
- Medium tasks: 1.0-1.3x  
- Hard tasks: 1.3-1.6x
- Very Hard tasks: 1.6-2.0x

CRITICAL - FAIR SUBJECT TREATMENT:
- ALL subjects deserve equal respect for equal effort
- Physics integration ≈ Accounts complex problems (both are hard)
- English literature analysis ≈ History source-based questions
- Economics theory ≈ Chemistry theory
- NEVER penalize commerce/humanities just because they're "easier"
- Consider conceptual difficulty, not just computation

Subject examples (at 60 minutes each):
- Physics electromagnetism (Hard): 60 × 1.4 = ~85 points
- Accounts partnership accounts (Hard): 60 × 1.4 = ~85 points
- Math calculus JEE (Very Hard): 60 × 1.7 = ~100 points
- Economics macro full chapter (Hard): 60 × 1.4 = ~85 points
- English essay writing (Medium): 60 × 1.2 = ~70 points
- History entire syllabus 3hr (Hard): 180 × 1.4 = ~250 points

RESPOND IN EXACTLY THIS JSON FORMAT (no markdown):
{
  "tier": "Easy|Medium|Hard|Very Hard",
  "score": <1-100 raw difficulty score>,
  "estimatedMinutes": <realistic time in minutes>,
  "points": <calculated points using formula above>,
  "justification": "<brief explanation of time estimate and point calculation>"
}`;

    // Use Lovable AI Gateway
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not found');
      throw new Error('AI service not configured. Please enable Lovable AI.');
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
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
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
    if (typeof difficulty.estimatedMinutes !== 'number' || difficulty.estimatedMinutes < 5) {
      difficulty.estimatedMinutes = 30; // Default fallback
    }
    if (typeof difficulty.points !== 'number' || difficulty.points < 1) {
      // Calculate points if AI didn't provide valid ones
      const multipliers = { 'Easy': 0.9, 'Medium': 1.15, 'Hard': 1.45, 'Very Hard': 1.8 };
      difficulty.points = Math.round(difficulty.estimatedMinutes * multipliers[difficulty.tier]);
    }

    // Sanity checks
    const minPoints = Math.max(10, Math.floor(difficulty.estimatedMinutes * 0.6));
    const maxPoints = Math.ceil(difficulty.estimatedMinutes * 2.5);
    
    if (difficulty.points < minPoints) difficulty.points = minPoints;
    if (difficulty.points > maxPoints) difficulty.points = maxPoints;

    // Cap estimated minutes reasonably
    if (difficulty.estimatedMinutes > 480) difficulty.estimatedMinutes = 480; // Max 8 hours

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
