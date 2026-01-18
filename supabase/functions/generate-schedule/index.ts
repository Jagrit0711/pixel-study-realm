import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleRequest {
  exams: Array<{
    id: string;
    name: string;
    start_date: string;
  }>;
  taskHistory: Array<{
    subject: string;
    chapter: string;
    task_type: string;
    difficulty_tier?: string;
    points: number;
    status: string;
    date: string;
  }>;
  profile: {
    board?: string;
    class?: string;
    current_streak: number;
    level: number;
  };
  targetDate: string;
  preferences?: {
    maxTasks?: number;
    focusSubjects?: string[];
    avoidDifficulty?: string[];
  };
}

interface ScheduledTask {
  title: string;
  subject: string;
  chapter: string;
  task_type: 'reading' | 'problem-solving' | 'revision' | 'practice' | 'test-prep';
  difficulty_tier: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  difficulty_score: number;
  points: number;
  estimated_minutes: number;
  justification: string;
  priority: 'high' | 'medium' | 'low';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: ScheduleRequest = await req.json();
    const { exams, taskHistory, profile, targetDate, preferences } = requestData;

    console.log('Generating schedule for:', targetDate, 'with', exams.length, 'exams and', taskHistory.length, 'historical tasks');

    // Analyze history patterns
    const completedTasks = taskHistory.filter(t => t.status === 'completed');
    const missedTasks = taskHistory.filter(t => t.status === 'missed');
    const subjectPerformance: Record<string, { completed: number; missed: number; avgPoints: number }> = {};
    
    completedTasks.forEach(t => {
      if (!subjectPerformance[t.subject]) {
        subjectPerformance[t.subject] = { completed: 0, missed: 0, avgPoints: 0 };
      }
      subjectPerformance[t.subject].completed++;
      subjectPerformance[t.subject].avgPoints += t.points;
    });
    
    missedTasks.forEach(t => {
      if (!subjectPerformance[t.subject]) {
        subjectPerformance[t.subject] = { completed: 0, missed: 0, avgPoints: 0 };
      }
      subjectPerformance[t.subject].missed++;
    });

    // Calculate averages
    Object.keys(subjectPerformance).forEach(subject => {
      const perf = subjectPerformance[subject];
      if (perf.completed > 0) {
        perf.avgPoints = Math.round(perf.avgPoints / perf.completed);
      }
    });

    // Build context for AI
    const examContext = exams.map(e => {
      const daysUntil = Math.ceil((new Date(e.start_date).getTime() - new Date(targetDate).getTime()) / (1000 * 60 * 60 * 24));
      return `- ${e.name}: ${daysUntil} days away (${e.start_date})`;
    }).join('\n');

    const historyContext = Object.entries(subjectPerformance).map(([subject, perf]) => {
      const completionRate = perf.completed + perf.missed > 0 
        ? Math.round((perf.completed / (perf.completed + perf.missed)) * 100)
        : 0;
      return `- ${subject}: ${completionRate}% completion rate, avg ${perf.avgPoints} points`;
    }).join('\n');

    const recentTasks = taskHistory
      .filter(t => t.status === 'completed')
      .slice(-10)
      .map(t => `${t.subject}: ${t.chapter || 'general'} (${t.task_type})`)
      .join(', ');

    const maxTasks = preferences?.maxTasks || 5;
    const focusSubjects = preferences?.focusSubjects?.join(', ') || 'all subjects';

    const prompt = `You are an AI study scheduler for a student. Generate a study schedule for ${targetDate}.

STUDENT CONTEXT:
- Board/Syllabus: ${profile.board || 'Not specified'}
- Class/Grade: ${profile.class || 'Not specified'}
- Current Level: ${profile.level}
- Current Streak: ${profile.current_streak} days

UPCOMING EXAMS:
${examContext || 'No exams scheduled'}

HISTORICAL PERFORMANCE BY SUBJECT:
${historyContext || 'No history available'}

RECENT COMPLETED TASKS:
${recentTasks || 'No recent tasks'}

PREFERENCES:
- Maximum tasks: ${maxTasks}
- Focus subjects: ${focusSubjects}

RULES:
1. Prioritize subjects with upcoming exams (closer = higher priority)
2. If a subject has low completion rate, assign easier tasks to build momentum
3. Balance between subjects to avoid burnout
4. Include a mix of task types (reading, problem-solving, revision, practice, test-prep)
5. Assign realistic difficulty based on proximity to exams
6. Tasks closer to exam should focus on revision and practice
7. Award more points for harder tasks (Easy: 10-25, Medium: 30-50, Hard: 60-80, Very Hard: 90-120)
8. Generate exactly ${maxTasks} tasks

TASK TYPES:
- reading: First-time learning of new chapters
- problem-solving: Working through exercises and problems
- revision: Reviewing already learned material
- practice: Practice questions and mock tests
- test-prep: Intensive exam preparation

OUTPUT FORMAT (JSON array):
[
  {
    "title": "Clear, actionable task title",
    "subject": "Subject name",
    "chapter": "Specific chapter or topic",
    "task_type": "one of: reading, problem-solving, revision, practice, test-prep",
    "difficulty_tier": "Easy | Medium | Hard | Very Hard",
    "difficulty_score": 1-100,
    "points": 10-120,
    "estimated_minutes": 15-120,
    "justification": "Brief reason why this task is assigned",
    "priority": "high | medium | low"
  }
]

Generate a smart, personalized study schedule. Return ONLY valid JSON array.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are an expert study scheduler AI. Generate personalized study schedules based on student performance and exam schedules. Always return valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON from response
    let tasks: ScheduledTask[];
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      tasks = JSON.parse(cleanContent);

      // Validate and sanitize tasks
      tasks = tasks.map(task => ({
        title: task.title || 'Study Task',
        subject: task.subject || 'General',
        chapter: task.chapter || '',
        task_type: ['reading', 'problem-solving', 'revision', 'practice', 'test-prep'].includes(task.task_type) 
          ? task.task_type 
          : 'reading',
        difficulty_tier: ['Easy', 'Medium', 'Hard', 'Very Hard'].includes(task.difficulty_tier)
          ? task.difficulty_tier
          : 'Medium',
        difficulty_score: Math.min(100, Math.max(1, task.difficulty_score || 50)),
        points: Math.min(120, Math.max(10, task.points || 30)),
        estimated_minutes: Math.min(120, Math.max(15, task.estimated_minutes || 30)),
        justification: task.justification || 'AI recommended',
        priority: ['high', 'medium', 'low'].includes(task.priority) ? task.priority : 'medium',
      }));

    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse schedule from AI');
    }

    console.log('Generated', tasks.length, 'tasks for schedule');

    return new Response(JSON.stringify({
      tasks,
      generatedAt: new Date().toISOString(),
      targetDate,
      analysis: {
        subjectPerformance,
        totalHistoricalTasks: taskHistory.length,
        upcomingExamsCount: exams.length,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Schedule generation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate schedule' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
