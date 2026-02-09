// Parent AI Service
// AI-powered insights and guidance for parents
// Integrates with mood data to provide personalized support

import { MoodCheckin } from '../types';
import { AIService, checkAPIStatus } from './AIProviderService';
import Constants from 'expo-constants';
import { format, subDays, getDay, getHours, differenceInDays } from 'date-fns';

// ============================================
// TYPES
// ============================================

export interface ParentInsight {
  type: 'pattern' | 'alert' | 'tip' | 'celebration';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  actionable?: string;
  emoji: string;
  color: string;
}

export interface ConversationStarter {
  question: string;
  context: string;
  followUps: string[];
  timing: 'now' | 'good-moment' | 'scheduled';
  tone: 'casual' | 'supportive' | 'celebratory';
}

export interface ResponseCoaching {
  situation: string;
  avoid: string[];
  try: string[];
  why: string;
  scripts: string[];
}

export interface MoodSummary {
  averageMood: number;
  trend: 'improving' | 'stable' | 'declining' | 'volatile';
  lowMoodPercentage: number;
  checkInStreak: number;
  lastCheckIn: Date | null;
  concernLevel: 'none' | 'mild' | 'moderate' | 'significant';
}

// ============================================
// CONFIGURATION
// ============================================

const getConfig = () => ({
  openaiKey: Constants.expoConfig?.extra?.openaiApiKey || process.env.OPENAI_API_KEY || '',
  anthropicKey: Constants.expoConfig?.extra?.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '',
  provider: Constants.expoConfig?.extra?.aiProvider || 'anthropic',
});

// ============================================
// MOOD ANALYSIS
// ============================================

export const analyzeMoodData = (checkins: MoodCheckin[]): MoodSummary => {
  if (checkins.length === 0) {
    return {
      averageMood: 0,
      trend: 'stable',
      lowMoodPercentage: 0,
      checkInStreak: 0,
      lastCheckIn: null,
      concernLevel: 'none',
    };
  }

  // Sort by date descending
  const sorted = [...checkins].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Average mood
  const averageMood = sorted.reduce((sum, c) => sum + c.mood, 0) / sorted.length;

  // Low mood percentage
  const lowMoodCount = sorted.filter(c => c.mood <= 2).length;
  const lowMoodPercentage = (lowMoodCount / sorted.length) * 100;

  // Trend analysis (compare recent vs older)
  const recentMoods = sorted.slice(0, Math.min(5, sorted.length));
  const olderMoods = sorted.slice(5, Math.min(10, sorted.length));
  
  const recentAvg = recentMoods.reduce((s, c) => s + c.mood, 0) / recentMoods.length;
  const olderAvg = olderMoods.length > 0 
    ? olderMoods.reduce((s, c) => s + c.mood, 0) / olderMoods.length 
    : recentAvg;
  
  // Check for volatility (high variance in recent moods)
  const variance = recentMoods.reduce((v, c) => v + Math.pow(c.mood - recentAvg, 2), 0) / recentMoods.length;
  const isVolatile = variance > 1.5;

  let trend: MoodSummary['trend'];
  if (isVolatile) {
    trend = 'volatile';
  } else if (recentAvg - olderAvg > 0.5) {
    trend = 'improving';
  } else if (olderAvg - recentAvg > 0.5) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }

  // Check-in streak
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const checkDate = subDays(today, i);
    const hasCheckin = sorted.some(c => 
      format(new Date(c.createdAt), 'yyyy-MM-dd') === format(checkDate, 'yyyy-MM-dd')
    );
    if (hasCheckin) streak++;
    else break;
  }

  // Concern level
  let concernLevel: MoodSummary['concernLevel'] = 'none';
  if (lowMoodPercentage > 60 || (trend === 'declining' && averageMood < 2.5)) {
    concernLevel = 'significant';
  } else if (lowMoodPercentage > 40 || (trend === 'declining' && averageMood < 3)) {
    concernLevel = 'moderate';
  } else if (lowMoodPercentage > 25 || trend === 'volatile') {
    concernLevel = 'mild';
  }

  return {
    averageMood,
    trend,
    lowMoodPercentage,
    checkInStreak: streak,
    lastCheckIn: sorted[0] ? new Date(sorted[0].createdAt) : null,
    concernLevel,
  };
};

// ============================================
// PERSONALIZED CONVERSATION STARTERS
// ============================================

const FALLBACK_STARTERS: ConversationStarter[] = [
  {
    question: "What was the best part of your day?",
    context: "Universal positive opener",
    followUps: ["What made it good?", "Did anything surprising happen?"],
    timing: 'good-moment',
    tone: 'casual',
  },
  {
    question: "Is there anything on your mind you want to talk about?",
    context: "Open invitation without pressure",
    followUps: ["I'm here whenever you're ready", "No pressure at all"],
    timing: 'good-moment',
    tone: 'supportive',
  },
  {
    question: "How are things with your friends lately?",
    context: "Peers are central to teen life",
    followUps: ["Anyone new you've been hanging out with?", "Any drama going on?"],
    timing: 'good-moment',
    tone: 'casual',
  },
];

export const generateConversationStarters = async (
  summary: MoodSummary,
  recentCheckins: MoodCheckin[],
  teenAge: number
): Promise<ConversationStarter[]> => {
  const config = getConfig();
  const apiStatus = checkAPIStatus();
  
  if (!apiStatus.configured) {
    return getContextualFallbackStarters(summary);
  }

  const recentMoodsStr = recentCheckins.slice(0, 5).map(c => 
    `${format(new Date(c.createdAt), 'EEE')}: ${['😢', '😔', '😐', '🙂', '😄'][c.mood - 1]} (${c.mood}/5)${c.note ? ` - "${c.note}"` : ''}`
  ).join('\n');

  const prompt = `You're helping a parent connect with their ${teenAge}-year-old teen.

## Recent Mood Data
${recentMoodsStr || 'No recent check-ins'}

## Mood Summary
- Average: ${summary.averageMood.toFixed(1)}/5
- Trend: ${summary.trend}
- Concern level: ${summary.concernLevel}
- Check-in streak: ${summary.checkInStreak} days

## Task
Generate 3 personalized conversation starters that:
1. Match the teen's current emotional state
2. Are age-appropriate for ${teenAge}
3. Feel natural, not interrogating
4. Open doors without pressure

For each starter, include:
- The question itself
- Why it's appropriate right now (brief context)
- 2 natural follow-up questions
- Best timing (now, good-moment, or scheduled)
- Tone (casual, supportive, or celebratory)

Respond with ONLY this JSON:
{
  "starters": [
    {
      "question": "string",
      "context": "string",
      "followUps": ["string", "string"],
      "timing": "now" | "good-moment" | "scheduled",
      "tone": "casual" | "supportive" | "celebratory"
    }
  ]
}`;

  try {
    const response = await callAI(prompt, 'conversation starters');
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.starters && Array.isArray(parsed.starters)) {
        return parsed.starters;
      }
    }
  } catch (error) {
    console.error('Conversation starter generation error:', error);
  }

  return getContextualFallbackStarters(summary);
};

const getContextualFallbackStarters = (summary: MoodSummary): ConversationStarter[] => {
  // Context-aware fallbacks based on mood data
  const starters: ConversationStarter[] = [];

  if (summary.trend === 'improving') {
    starters.push({
      question: "You seem like you've been in better spirits lately. What's been going well?",
      context: "Acknowledge positive trend",
      followUps: ["That's great to hear!", "What do you think helped?"],
      timing: 'good-moment',
      tone: 'celebratory',
    });
  }

  if (summary.trend === 'declining' || summary.concernLevel !== 'none') {
    starters.push({
      question: "Hey, I've been thinking about you. How are you really doing?",
      context: "Gentle check-in during harder times",
      followUps: ["I'm here if you want to talk", "No pressure, just wanted you to know I care"],
      timing: 'good-moment',
      tone: 'supportive',
    });
  }

  if (summary.checkInStreak >= 5) {
    starters.push({
      question: "I noticed you've been checking in consistently — that's awesome. Does it help?",
      context: "Acknowledge their engagement",
      followUps: ["What made you decide to keep it up?", "I'm proud of you for that"],
      timing: 'good-moment',
      tone: 'celebratory',
    });
  }

  // Add generic ones to fill to 3
  while (starters.length < 3) {
    starters.push(FALLBACK_STARTERS[starters.length]);
  }

  return starters.slice(0, 3);
};

// ============================================
// AI-POWERED INSIGHTS
// ============================================

export const generateAIInsights = async (
  checkins: MoodCheckin[],
  summary: MoodSummary,
  teenAge: number
): Promise<ParentInsight[]> => {
  const apiStatus = checkAPIStatus();
  
  // Always generate basic pattern insights
  const basicInsights = generateBasicInsights(checkins, summary);
  
  if (!apiStatus.configured || checkins.length < 5) {
    return basicInsights;
  }

  // Prepare data for AI
  const moodTimeline = checkins.slice(0, 14).map(c => ({
    date: format(new Date(c.createdAt), 'EEE MMM d'),
    time: format(new Date(c.createdAt), 'h:mm a'),
    mood: c.mood,
    note: c.note || null,
  }));

  const prompt = `You're a child psychologist helping a parent understand their ${teenAge}-year-old teen's emotional patterns.

## Mood Check-in Data (last 2 weeks)
${JSON.stringify(moodTimeline, null, 2)}

## Summary Stats
- Average mood: ${summary.averageMood.toFixed(1)}/5
- Trend: ${summary.trend}
- Low mood frequency: ${summary.lowMoodPercentage.toFixed(0)}%
- Check-in streak: ${summary.checkInStreak} days

## Task
Analyze this data and provide 2-3 insights that would help a parent:
1. Understand patterns they might not notice
2. Know when/how to connect
3. Recognize what's normal vs. concerning for this age

Be warm, not clinical. Focus on actionable guidance.

Respond with ONLY this JSON:
{
  "insights": [
    {
      "type": "pattern" | "alert" | "tip" | "celebration",
      "priority": "low" | "medium" | "high",
      "title": "Short title",
      "description": "2-3 sentences explaining the insight",
      "actionable": "Specific suggestion for the parent",
      "emoji": "single emoji",
      "color": "hex color"
    }
  ]
}`;

  try {
    const response = await callAI(prompt, 'insights');
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.insights && Array.isArray(parsed.insights)) {
        // Combine AI insights with basic pattern insights
        return [...parsed.insights, ...basicInsights].slice(0, 5);
      }
    }
  } catch (error) {
    console.error('AI insights generation error:', error);
  }

  return basicInsights;
};

const generateBasicInsights = (
  checkins: MoodCheckin[],
  summary: MoodSummary
): ParentInsight[] => {
  const insights: ParentInsight[] = [];

  // Trend-based insights
  if (summary.trend === 'improving') {
    insights.push({
      type: 'celebration',
      priority: 'low',
      title: 'Things are looking up! 📈',
      description: "Your teen's mood has been trending positively. Something is going right — this is worth acknowledging!",
      actionable: "Ask what's been going well lately. Celebrate the wins together.",
      emoji: '✨',
      color: '#10B981',
    });
  } else if (summary.trend === 'declining') {
    insights.push({
      type: 'alert',
      priority: 'medium',
      title: 'Worth a gentle check-in',
      description: "Mood has dipped compared to earlier. Could be temporary, but worth keeping an eye on.",
      actionable: "Create a low-pressure moment to connect. Don't interrogate — just be present.",
      emoji: '💛',
      color: '#F59E0B',
    });
  } else if (summary.trend === 'volatile') {
    insights.push({
      type: 'pattern',
      priority: 'medium',
      title: 'Emotional ups and downs',
      description: "Moods have been swinging more than usual. This can be normal for teens, but stability matters.",
      actionable: "Try to maintain consistent routines. Teens thrive on predictability even when they resist it.",
      emoji: '🎢',
      color: '#8B5CF6',
    });
  }

  // Streak insights
  if (summary.checkInStreak >= 7) {
    insights.push({
      type: 'celebration',
      priority: 'low',
      title: `${summary.checkInStreak} day streak! 🔥`,
      description: "Consistent check-ins show self-awareness and engagement. This is a great sign!",
      emoji: '🎯',
      color: '#10B981',
    });
  } else if (summary.lastCheckIn) {
    const daysSince = differenceInDays(new Date(), summary.lastCheckIn);
    if (daysSince >= 3) {
      insights.push({
        type: 'alert',
        priority: daysSince >= 5 ? 'high' : 'medium',
        title: daysSince >= 5 ? 'Radio silence' : 'Been a few days',
        description: `No check-in in ${daysSince} days. Could be nothing, or they might be going through something.`,
        actionable: "Reach out casually. A simple 'thinking of you' text can open doors.",
        emoji: '📵',
        color: daysSince >= 5 ? '#EF4444' : '#F59E0B',
      });
    }
  }

  // Concern level insights
  if (summary.concernLevel === 'significant') {
    insights.push({
      type: 'alert',
      priority: 'urgent',
      title: 'Consistent low moods',
      description: `${Math.round(summary.lowMoodPercentage)}% of check-ins show low mood. This pattern deserves attention.`,
      actionable: "Consider having a deeper conversation or consulting a professional. Trust your instincts.",
      emoji: '❤️',
      color: '#DC2626',
    });
  }

  return insights;
};

// ============================================
// RESPONSE COACHING
// ============================================

export const getResponseCoaching = async (
  situation: string,
  teenAge: number,
  summary?: MoodSummary
): Promise<ResponseCoaching> => {
  const apiStatus = checkAPIStatus();
  
  if (!apiStatus.configured) {
    return getFallbackCoaching(situation);
  }

  const moodContext = summary 
    ? `Their recent mood trend: ${summary.trend}, average: ${summary.averageMood.toFixed(1)}/5`
    : 'No recent mood data available';

  const prompt = `You're a family therapist coaching a parent on how to respond to their ${teenAge}-year-old teen.

## Situation
"${situation}"

## Context
${moodContext}

## Task
Provide response coaching that:
1. Shows what to avoid (common parent mistakes)
2. Offers better approaches
3. Explains why this works developmentally
4. Gives 2 specific scripts they could actually use

Be practical and warm. These are real conversations with real stakes.

Respond with ONLY this JSON:
{
  "situation": "Restate the situation briefly",
  "avoid": ["thing to avoid 1", "thing to avoid 2"],
  "try": ["better approach 1", "better approach 2"],
  "why": "Brief developmental psychology explanation",
  "scripts": ["Exact words they could say", "Another option"]
}`;

  try {
    const response = await callAI(prompt, 'response coaching');
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Response coaching error:', error);
  }

  return getFallbackCoaching(situation);
};

const COMMON_SITUATIONS: Record<string, ResponseCoaching> = {
  'withdrawn': {
    situation: "Teen is withdrawn and won't talk",
    avoid: [
      "Why won't you talk to me?",
      "What's wrong with you?",
      "You need to communicate!",
    ],
    try: [
      "Stay physically present without demanding conversation",
      "Offer low-pressure activities (car rides, cooking together)",
      "Let them know you're available without conditions",
    ],
    why: "Pressure to talk triggers the 'fight or flight' response. Teens open up when they feel safe, not cornered. Non-verbal presence communicates care without demand.",
    scripts: [
      "I'm here if you want to talk. No pressure at all.",
      "Want to grab food? No agenda — just thought it'd be nice.",
    ],
  },
  'angry': {
    situation: "Teen is angry or snapping at you",
    avoid: [
      "Don't talk to me like that!",
      "Show some respect!",
      "Go to your room until you can be civil!",
    ],
    try: [
      "Stay calm (don't match their energy)",
      "Acknowledge the emotion, not the behavior",
      "Give space, then reconnect later",
    ],
    why: "The teenage prefrontal cortex (logic/impulse control) goes offline during high emotion. Demanding respect in that moment escalates conflict. Waiting for calm allows their brain to come back online.",
    scripts: [
      "I can see you're really frustrated. Let's talk when things are calmer.",
      "That seems to have really upset you. I'm going to give you some space, and we can figure this out later.",
    ],
  },
  'sad': {
    situation: "Teen seems sad or down",
    avoid: [
      "You have nothing to be sad about",
      "Other kids have it worse",
      "Cheer up!",
    ],
    try: [
      "Validate their feelings without trying to fix",
      "Offer presence, not solutions",
      "Ask what they need (space, company, help)",
    ],
    why: "Dismissing feelings teaches teens to hide emotions. Validation — just acknowledging their experience is real — is often all they need. It builds trust and keeps communication open.",
    scripts: [
      "It seems like you're going through something hard. Want to talk, or just want company?",
      "I'm sorry you're feeling this way. I'm here — whatever you need.",
    ],
  },
  'anxious': {
    situation: "Teen is anxious about something",
    avoid: [
      "Just calm down",
      "It's not a big deal",
      "You're overthinking this",
    ],
    try: [
      "Acknowledge the anxiety without judgment",
      "Help them think through scenarios (cognitive approach)",
      "Focus on what they can control",
    ],
    why: "Anxiety can't be reasoned away, but feeling heard reduces its intensity. Walking through 'what ifs' together helps the brain process fear. Focus on controllables builds agency.",
    scripts: [
      "That sounds really stressful. What's the worst case you're imagining? Let's think through it.",
      "It makes sense you're worried about this. What part feels most overwhelming?",
    ],
  },
};

const getFallbackCoaching = (situation: string): ResponseCoaching => {
  const lower = situation.toLowerCase();
  
  if (lower.includes('withdrawn') || lower.includes('won\'t talk') || lower.includes('silent')) {
    return COMMON_SITUATIONS['withdrawn'];
  }
  if (lower.includes('angry') || lower.includes('mad') || lower.includes('snapping')) {
    return COMMON_SITUATIONS['angry'];
  }
  if (lower.includes('sad') || lower.includes('down') || lower.includes('depressed')) {
    return COMMON_SITUATIONS['sad'];
  }
  if (lower.includes('anxious') || lower.includes('worried') || lower.includes('stressed')) {
    return COMMON_SITUATIONS['anxious'];
  }

  // Generic fallback
  return {
    situation: situation,
    avoid: [
      "Interrogating with 'why' questions",
      "Jumping to solutions",
      "Dismissing their feelings",
    ],
    try: [
      "Listen more than you speak",
      "Validate before advising",
      "Ask what they need from you",
    ],
    why: "Teens are more likely to open up when they feel heard, not judged. Leading with curiosity rather than conclusions keeps doors open.",
    scripts: [
      "Tell me more about that.",
      "What do you need from me right now — advice, or just someone to listen?",
    ],
  };
};

// ============================================
// ALERT GENERATION
// ============================================

export interface ParentAlert {
  level: 'green' | 'yellow' | 'red';
  title: string;
  message: string;
  guidance: string;
  actionItems?: string[];
}

export const generateAlert = (summary: MoodSummary): ParentAlert => {
  if (summary.concernLevel === 'significant') {
    return {
      level: 'red',
      title: 'Needs Attention',
      message: "Your teen has been experiencing frequent low moods. This pattern is worth addressing.",
      guidance: "Consider having a direct but gentle conversation. If you're concerned, consulting a professional is a sign of good parenting, not failure.",
      actionItems: [
        "Create a calm moment to check in",
        "Ask directly: 'I've noticed you seem down lately. How are you really doing?'",
        "Consider whether outside support (counselor, therapist) might help",
      ],
    };
  }

  if (summary.concernLevel === 'moderate' || summary.trend === 'declining') {
    return {
      level: 'yellow',
      title: 'Check In',
      message: "Some lower moments recently. Might be temporary, but worth a gentle check-in.",
      guidance: "Create a low-pressure opportunity to connect. Car rides, cooking together, or watching their show can open doors.",
      actionItems: [
        "Plan a casual one-on-one moment",
        "Ask about their day without interrogating",
        "Let them know you're available if they want to talk",
      ],
    };
  }

  return {
    level: 'green',
    title: 'All Good',
    message: "Your teen seems to be doing well! Keep up the connection.",
    guidance: "Good times are great for building the relationship. The trust you build now pays off during harder times.",
    actionItems: [
      "Keep showing up consistently",
      "Celebrate wins together",
      "Have fun without an agenda",
    ],
  };
};

// ============================================
// AI API HELPER
// ============================================

const callAI = async (prompt: string, task: string): Promise<string> => {
  const config = getConfig();
  
  // Try Anthropic first
  if (config.anthropicKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 500,
          temperature: 0.7,
          system: 'You are a supportive family psychology expert. Respond only with valid JSON.',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.content[0].text;
      }
    } catch (error) {
      console.warn(`Anthropic failed for ${task}, trying OpenAI...`);
    }
  }

  // Fallback to OpenAI
  if (config.openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a supportive family psychology expert. Respond only with valid JSON.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.error(`OpenAI also failed for ${task}:`, error);
    }
  }

  throw new Error('No AI providers available');
};

// ============================================
// EXPORTS
// ============================================

export const ParentAIService = {
  analyzeMoodData,
  generateConversationStarters,
  generateAIInsights,
  getResponseCoaching,
  generateAlert,
};

export default ParentAIService;
