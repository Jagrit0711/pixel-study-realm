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
  estimatedMinutes?: number;
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
    const { subject, chapter, taskType, examName, examDate, board, classLevel, estimatedMinutes } = await req.json() as DifficultyRequest;

    console.log('Analyzing difficulty for:', { subject, chapter, taskType, examName, examDate, board, classLevel, estimatedMinutes });

    // Calculate days until exam
    let daysUntilExam = null;
    if (examDate) {
      const examDateTime = new Date(examDate);
      const now = new Date();
      daysUntilExam = Math.ceil((examDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    const timeEstimate = estimatedMinutes || 30;

    const prompt = `You are an expert academic difficulty analyzer for Indian school/competitive exam students.

Analyze the following study task and provide a FAIR and BALANCED difficulty assessment:

Subject: ${subject}
Chapter/Topic: ${chapter}
Task Type: ${taskType}
Estimated Time: ${timeEstimate} minutes
${examName ? `Exam: ${examName}` : ''}
${board ? `Board/Syllabus: ${board}` : ''}
${classLevel ? `Class: ${classLevel}` : ''}
${daysUntilExam !== null ? `Days until exam: ${daysUntilExam}` : ''}

CRITICAL SCORING RULES:
1. TIME IS THE PRIMARY FACTOR (40% weight): More time = more points
   - 15-30 min tasks: Base 15-25 points
   - 30-60 min tasks: Base 25-40 points
   - 60-120 min tasks: Base 40-70 points
   - 120+ min tasks: Base 70-100+ points

2. SUBJECT DIFFICULTY (30% weight):
   - STEM (Physics, Chemistry, Math): +20-30% bonus
   - Commerce (Accounts, Economics, Business): Similar to STEM difficulty
   - Humanities (History, Geography, Political Science): Standard base
   - Languages (English, Hindi): Slightly lower (-10%)
   
3. TOPIC COMPLEXITY (20% weight):
   - Advanced topics (Integration, Electromagnetism, Organic Chemistry): +15-25%
   - Basic/Overview topics: Standard
   - Grammar, simple comprehension: -10-15%

4. TASK TYPE (10% weight):
   - Problem-solving: +15%
   - Practice questions: +10%
   - Test-prep: +5%
   - Revision: Standard
   - Reading: -5%

EXAMPLES FOR CALIBRATION:
- "Physics - Integration, 15 problems, 45 min" → 35-45 points (NOT 70!)
- "English - Complete syllabus revision, 3 hours" → 90-110 points
- "Math - JEE level Calculus, 2 hours" → 80-100 points
- "History - One chapter reading, 30 min" → 20-30 points
- "Accounts - Balance sheets practice, 1 hour" → 45-55 points

DO NOT over-inflate points just because a subject is "hard". Time spent is the PRIMARY factor.
Commerce and Humanities subjects should get FAIR points based on time and effort, not be dismissed.

Respond in EXACTLY this JSON format (no markdown, no explanation):
{
  "tier": "Easy|Medium|Hard|Very Hard",
  "score": <number 1-100 representing raw difficulty>,
  "points": <number based on TIME PRIMARILY, adjusted by difficulty>,
  "justification": "<2-3 sentences explaining the point allocation with time as key factor>"
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
    if (typeof difficulty.points !== 'number' || difficulty.points < 1) {
      throw new Error('Invalid points from AI');
    }

    // Apply time-based sanity check
    const minPoints = Math.floor(timeEstimate * 0.5); // At least 0.5 points per minute
    const maxPoints = Math.ceil(timeEstimate * 2.5); // At most 2.5 points per minute
    
    if (difficulty.points < minPoints) {
      difficulty.points = minPoints;
    }
    if (difficulty.points > maxPoints) {
      difficulty.points = maxPoints;
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