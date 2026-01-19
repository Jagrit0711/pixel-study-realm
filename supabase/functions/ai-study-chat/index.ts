import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  context: {
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
      name?: string;
    };
  };
  action?: 'chat' | 'generate_plan';
  planDate?: string;
  maxTasks?: number;
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
    const requestData: ChatRequest = await req.json();
    const { messages, context, action, planDate, maxTasks } = requestData;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context string
    const examContext = context.exams.map(e => {
      const daysUntil = Math.ceil((new Date(e.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return `${e.name}: ${daysUntil > 0 ? `${daysUntil} days away` : 'Ongoing/Past'}`;
    }).join(', ');

    const completedTasks = context.taskHistory.filter(t => t.status === 'completed');
    const missedTasks = context.taskHistory.filter(t => t.status === 'missed');
    const subjects = [...new Set(context.taskHistory.map(t => t.subject))];

    const systemPrompt = `You are a friendly, encouraging AI study buddy named "Study Buddy" for STFU Exams app. You're like a supportive friend who helps students plan their studies.

STUDENT CONTEXT:
- Name: ${context.profile.name || 'Student'}
- Board/Syllabus: ${context.profile.board || 'Not specified'}
- Class/Grade: ${context.profile.class || 'Not specified'}
- Level: ${context.profile.level}
- Current Streak: ${context.profile.current_streak} days
- Upcoming Exams: ${examContext || 'None scheduled'}
- Subjects they study: ${subjects.join(', ') || 'Not specified yet'}
- Tasks completed: ${completedTasks.length}, Tasks missed: ${missedTasks.length}

PERSONALITY:
- Be casual, friendly, and encouraging (use emojis occasionally)
- Keep responses concise (1-3 sentences for casual chat)
- Be empathetic about exam stress
- Celebrate their progress and streak
- Give practical, actionable advice

CAPABILITIES:
- Chat about study strategies and motivation
- Help plan what to study
- When user wants a study plan, ask what date they want it for
- When they confirm to make a plan, respond with the special marker: [GENERATE_PLAN:DATE:MAX_TASKS]
  For example: [GENERATE_PLAN:2024-01-20:5]

RULES:
- Don't generate study plans directly in chat - use the marker
- If user asks to make a plan without date, ask which date
- If they say "tomorrow" or "today", calculate the date
- Default to 5 tasks if they don't specify
- Be supportive, not pushy`;

    // If action is generate_plan, generate the actual schedule
    if (action === 'generate_plan' && planDate) {
      console.log('Generating plan for:', planDate);
      
      const planPrompt = buildPlanPrompt(context, planDate, maxTasks || 5);
      
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: 'You are an expert study scheduler. Generate personalized study schedules. Always return valid JSON array.' },
            { role: 'user', content: planPrompt }
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

      let tasks: ScheduledTask[] = parseTasks(content);

      return new Response(JSON.stringify({
        type: 'plan',
        tasks,
        targetDate: planDate,
        message: `Here's your personalized study plan for ${formatDate(planDate)}! 📚✨ I've created ${tasks.length} tasks based on your upcoming exams and study history. Review them and add the ones you want to tackle!`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Regular chat
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10) // Keep last 10 messages for context
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
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
    const reply = aiData.choices?.[0]?.message?.content || "I'm here to help! What would you like to study today?";

    return new Response(JSON.stringify({
      type: 'chat',
      message: reply
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to process chat' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildPlanPrompt(context: ChatRequest['context'], targetDate: string, maxTasks: number): string {
  const examContext = context.exams.map(e => {
    const daysUntil = Math.ceil((new Date(e.start_date).getTime() - new Date(targetDate).getTime()) / (1000 * 60 * 60 * 24));
    return `- ${e.name}: ${daysUntil} days away (${e.start_date})`;
  }).join('\n');

  const subjectPerformance: Record<string, { completed: number; missed: number }> = {};
  context.taskHistory.forEach(t => {
    if (!subjectPerformance[t.subject]) {
      subjectPerformance[t.subject] = { completed: 0, missed: 0 };
    }
    if (t.status === 'completed') subjectPerformance[t.subject].completed++;
    if (t.status === 'missed') subjectPerformance[t.subject].missed++;
  });

  const historyContext = Object.entries(subjectPerformance).map(([subject, perf]) => {
    const total = perf.completed + perf.missed;
    const rate = total > 0 ? Math.round((perf.completed / total) * 100) : 0;
    return `- ${subject}: ${rate}% completion (${perf.completed}/${total})`;
  }).join('\n');

  return `Generate a study schedule for ${targetDate}.

STUDENT:
- Board: ${context.profile.board || 'Not specified'}
- Class: ${context.profile.class || 'Not specified'}
- Level: ${context.profile.level}, Streak: ${context.profile.current_streak} days

EXAMS:
${examContext || 'No exams scheduled'}

PERFORMANCE:
${historyContext || 'No history'}

Generate exactly ${maxTasks} tasks. Prioritize subjects with upcoming exams.

OUTPUT (JSON array only):
[
  {
    "title": "Task title",
    "subject": "Subject",
    "chapter": "Chapter/Topic",
    "task_type": "reading|problem-solving|revision|practice|test-prep",
    "difficulty_tier": "Easy|Medium|Hard|Very Hard",
    "difficulty_score": 1-100,
    "points": 10-120,
    "estimated_minutes": 15-120,
    "justification": "Why this task",
    "priority": "high|medium|low"
  }
]`;
}

function parseTasks(content: string): ScheduledTask[] {
  try {
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
    else if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
    if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
    cleanContent = cleanContent.trim();

    const tasks = JSON.parse(cleanContent);
    return tasks.map((task: any) => ({
      title: task.title || 'Study Task',
      subject: task.subject || 'General',
      chapter: task.chapter || '',
      task_type: ['reading', 'problem-solving', 'revision', 'practice', 'test-prep'].includes(task.task_type) ? task.task_type : 'reading',
      difficulty_tier: ['Easy', 'Medium', 'Hard', 'Very Hard'].includes(task.difficulty_tier) ? task.difficulty_tier : 'Medium',
      difficulty_score: Math.min(100, Math.max(1, task.difficulty_score || 50)),
      points: Math.min(120, Math.max(10, task.points || 30)),
      estimated_minutes: Math.min(120, Math.max(15, task.estimated_minutes || 30)),
      justification: task.justification || 'AI recommended',
      priority: ['high', 'medium', 'low'].includes(task.priority) ? task.priority : 'medium',
    }));
  } catch (e) {
    console.error('Parse error:', e);
    return [];
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}
