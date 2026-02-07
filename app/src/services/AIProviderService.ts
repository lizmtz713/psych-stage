// AI Provider Service
// Integrates with OpenAI and Anthropic for real AI-powered roleplay conversations

import { RoleplayScenario } from '../data/roleplay-scenarios';
import Constants from 'expo-constants';

// ============================================
// CONFIGURATION
// ============================================

interface AIConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

const getConfig = (): AIConfig => {
  // Get from environment or config
  const provider = Constants.expoConfig?.extra?.aiProvider || 'anthropic';
  
  return {
    provider,
    apiKey: provider === 'openai' 
      ? Constants.expoConfig?.extra?.openaiApiKey || process.env.OPENAI_API_KEY || ''
      : Constants.expoConfig?.extra?.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '',
    model: provider === 'openai' ? 'gpt-4o' : 'claude-sonnet-4-20250514',
    maxTokens: 300,
    temperature: 0.8,
  };
};

// ============================================
// SYSTEM PROMPTS
// ============================================

const buildSystemPrompt = (
  scenario: RoleplayScenario,
  userAge: number
): string => {
  const ageContext = getAgeContext(userAge);
  
  return `You are playing a character in a roleplay scenario to help someone practice difficult conversations. 

## Your Role
You are: ${scenario.persona}
Description: ${scenario.personaDescription}
Personality traits: ${scenario.personaTraits.join(', ')}

## Scenario Context
${scenario.context}

## Your Behavior Guidelines
- Stay in character as ${scenario.persona}
- Response style: ${scenario.responseStyle}
- Your responses should feel realistic and natural
- Don't be cartoonishly difficult or easy — be believably human
- React to what the user says, not a script
- Your responses should be 1-3 sentences typically (conversational length)

## Escalation/De-escalation
If user says something that triggers escalation (dismissive, aggressive, etc.):
${scenario.escalationTriggers.length > 0 ? scenario.escalationTriggers.join('\n') : '- React naturally but don\'t be unreasonable'}

If user handles it well (assertive, respectful, clear), you can:
${scenario.deescalationResponses.length > 0 ? scenario.deescalationResponses.join('\n') : '- Respond positively, show they\'re getting through'}

## User Age Context
${ageContext}

## Important Safety Rules
- If the user reveals they are in actual crisis (mentions wanting to hurt themselves, suicide, abuse happening NOW), break character immediately and provide crisis resources:
  "I want to pause the roleplay for a moment. What you're describing sounds serious. If you're in crisis, please reach out: Call/text 988, or text HOME to 741741. Are you safe right now?"
- Never encourage harmful behavior
- This is practice for healthy communication

## Conversation Goal
Help them practice: ${scenario.skillsTargeted.join(', ')}

Stay in character. Respond only as ${scenario.persona}. Do not break character unless there's a safety concern.`;
};

const getAgeContext = (age: number): string => {
  if (age < 14) {
    return `The user is ${age} years old (middle childhood/early adolescence). Use simple, clear language. They may be concrete thinkers. Be patient and not condescending.`;
  } else if (age < 18) {
    return `The user is ${age} years old (adolescent). They can handle nuanced conversation. Respect their intelligence but remember they're still developing. They may be sensitive to feeling talked down to.`;
  } else if (age < 25) {
    return `The user is ${age} years old (young adult). Treat them as an adult. They can handle complex conversation. They're practicing adult situations.`;
  } else if (age < 40) {
    return `The user is ${age} years old (adult). Full adult conversation appropriate. They're dealing with adult life situations.`;
  } else {
    return `The user is ${age} years old (mature adult). They have life experience. Respect their autonomy and wisdom while still playing your character authentically.`;
  }
};

// ============================================
// SAFETY DETECTION
// ============================================

const CRISIS_PATTERNS = [
  /want to (kill|hurt|end) (myself|my life)/i,
  /going to (kill|hurt) myself/i,
  /suicide/i,
  /don'?t want to (live|be here|exist)/i,
  /better off dead/i,
  /no point (in|to) living/i,
  /end it all/i,
  /can'?t (go on|take it|do this) anymore/i,
  /want to disappear/i,
  /nobody would (care|miss me)/i,
];

export const detectCrisis = (message: string): boolean => {
  return CRISIS_PATTERNS.some(pattern => pattern.test(message));
};

const SAFETY_RESPONSE = `I want to pause the roleplay for a moment. What you're sharing sounds really heavy, and I want to make sure you're okay.

If you're having thoughts of hurting yourself, please reach out to someone who can help:
• **988 Suicide & Crisis Lifeline**: Call or text 988
• **Crisis Text Line**: Text HOME to 741741

These are free, confidential, and available 24/7.

Are you safe right now? If this was just part of the roleplay and you're okay, we can continue. If you're actually struggling, it's okay to say so. 💜`;

// ============================================
// API CALLS
// ============================================

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIResponse {
  content: string;
  safetyTriggered: boolean;
  error?: string;
}

// OpenAI API
const callOpenAI = async (
  systemPrompt: string,
  messages: Message[],
  config: AIConfig
): Promise<AIResponse> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      safetyTriggered: false,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      content: '',
      safetyTriggered: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Anthropic API
const callAnthropic = async (
  systemPrompt: string,
  messages: Message[],
  config: AIConfig
): Promise<AIResponse> => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API error');
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      safetyTriggered: false,
    };
  } catch (error) {
    console.error('Anthropic API error:', error);
    return {
      content: '',
      safetyTriggered: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ============================================
// MAIN INTERFACE
// ============================================

export interface ConversationMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface GenerateResponseParams {
  scenario: RoleplayScenario;
  conversationHistory: ConversationMessage[];
  userMessage: string;
  userAge: number;
}

export interface GenerateResponseResult {
  content: string;
  safetyTriggered: boolean;
  error?: string;
}

export const generateAIResponse = async (
  params: GenerateResponseParams
): Promise<GenerateResponseResult> => {
  const { scenario, conversationHistory, userMessage, userAge } = params;
  
  // Check for crisis first
  if (detectCrisis(userMessage)) {
    return {
      content: SAFETY_RESPONSE,
      safetyTriggered: true,
    };
  }
  
  // Check scenario-specific safety triggers
  const scenarioTrigger = scenario.safetyTriggers.find(trigger =>
    userMessage.toLowerCase().includes(trigger.toLowerCase())
  );
  if (scenarioTrigger) {
    return {
      content: SAFETY_RESPONSE,
      safetyTriggered: true,
    };
  }
  
  // Build messages for API
  const messages: Message[] = conversationHistory.map(m => ({
    role: m.role === 'ai' ? 'assistant' : 'user',
    content: m.content,
  }));
  messages.push({ role: 'user', content: userMessage });
  
  // Build system prompt
  const systemPrompt = buildSystemPrompt(scenario, userAge);
  
  // Get config and call appropriate API
  const config = getConfig();
  
  if (!config.apiKey) {
    return {
      content: "I couldn't connect to the AI service. Please check your API configuration.",
      safetyTriggered: false,
      error: 'No API key configured',
    };
  }
  
  const response = config.provider === 'openai'
    ? await callOpenAI(systemPrompt, messages, config)
    : await callAnthropic(systemPrompt, messages, config);
  
  return response;
};

// ============================================
// FEEDBACK GENERATION
// ============================================

export interface FeedbackParams {
  scenario: RoleplayScenario;
  conversationHistory: ConversationMessage[];
  userAge: number;
}

export interface FeedbackResult {
  strengths: string[];
  growthAreas: string[];
  suggestion: string;
  overallScore: number;
  detailedFeedback: string;
}

const buildFeedbackPrompt = (
  scenario: RoleplayScenario,
  conversationHistory: ConversationMessage[],
  userAge: number
): string => {
  const userMessages = conversationHistory
    .filter(m => m.role === 'user')
    .map((m, i) => `Response ${i + 1}: "${m.content}"`)
    .join('\n');
  
  return `You are a supportive communication coach analyzing a roleplay practice session.

## Scenario
Title: ${scenario.title}
Skills practiced: ${scenario.skillsTargeted.join(', ')}
Good response examples: ${scenario.goodResponses.join(' | ')}
Common mistakes to avoid: ${scenario.commonMistakes.join(' | ')}

## User's Responses
${userMessages}

## User Age: ${userAge}

## Your Task
Provide constructive, encouraging feedback. Be specific about what they did well and what they could improve. Adjust your language for their age.

Respond in this exact JSON format:
{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "growthAreas": ["area 1", "area 2"],
  "suggestion": "One specific thing to try next time",
  "overallScore": 4,
  "detailedFeedback": "A paragraph of personalized feedback"
}

overallScore should be 1-5:
1 = Needs significant work
2 = Getting there
3 = Good effort
4 = Great job
5 = Excellent

Be encouraging! Focus on growth, not criticism. Start with what they did well.`;
};

export const generateFeedback = async (
  params: FeedbackParams
): Promise<FeedbackResult> => {
  const { scenario, conversationHistory, userAge } = params;
  
  const config = getConfig();
  
  if (!config.apiKey) {
    // Return fallback feedback
    return generateFallbackFeedback(scenario, conversationHistory, userAge);
  }
  
  const prompt = buildFeedbackPrompt(scenario, conversationHistory, userAge);
  
  try {
    let responseContent: string;
    
    if (config.provider === 'openai') {
      const response = await callOpenAI(
        'You are a supportive communication coach. Respond only with valid JSON.',
        [{ role: 'user', content: prompt }],
        { ...config, temperature: 0.5 }
      );
      responseContent = response.content;
    } else {
      const response = await callAnthropic(
        'You are a supportive communication coach. Respond only with valid JSON.',
        [{ role: 'user', content: prompt }],
        { ...config, temperature: 0.5 }
      );
      responseContent = response.content;
    }
    
    // Parse JSON response
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        strengths: parsed.strengths || [],
        growthAreas: parsed.growthAreas || [],
        suggestion: parsed.suggestion || 'Keep practicing!',
        overallScore: parsed.overallScore || 3,
        detailedFeedback: parsed.detailedFeedback || '',
      };
    }
    
    throw new Error('Could not parse feedback JSON');
  } catch (error) {
    console.error('Feedback generation error:', error);
    return generateFallbackFeedback(scenario, conversationHistory, userAge);
  }
};

// Fallback when API unavailable
const generateFallbackFeedback = (
  scenario: RoleplayScenario,
  conversationHistory: ConversationMessage[],
  userAge: number
): FeedbackResult => {
  const userMessages = conversationHistory.filter(m => m.role === 'user');
  
  // Basic analysis
  const usedIStatements = userMessages.some(m => 
    m.content.toLowerCase().includes('i feel') || 
    m.content.toLowerCase().includes('i need')
  );
  
  const wasAssertive = userMessages.some(m =>
    m.content.toLowerCase().includes('no') ||
    m.content.toLowerCase().includes("i don't") ||
    m.content.toLowerCase().includes('i need')
  );
  
  const strengths = ['You engaged with the practice scenario'];
  if (usedIStatements) strengths.push('You used "I" statements to express yourself');
  if (wasAssertive) strengths.push('You were clear about your position');
  
  const growthAreas = [];
  if (!wasAssertive) growthAreas.push('Try being more direct about what you need');
  if (!usedIStatements) growthAreas.push('Practice using "I feel..." statements');
  if (growthAreas.length === 0) growthAreas.push('Keep practicing to build confidence');
  
  return {
    strengths: strengths.slice(0, 3),
    growthAreas: growthAreas.slice(0, 2),
    suggestion: scenario.hints[0] || 'Keep practicing difficult conversations!',
    overallScore: wasAssertive && usedIStatements ? 4 : 3,
    detailedFeedback: 'You completed the practice scenario. Each time you practice, you build skills for real conversations.',
  };
};

// ============================================
// HINT GENERATION
// ============================================

export const generateContextualHint = async (
  scenario: RoleplayScenario,
  conversationHistory: ConversationMessage[],
  userAge: number
): Promise<string> => {
  // Use scenario hints first
  const hintIndex = conversationHistory.filter(m => m.role === 'user').length;
  if (scenario.hints[hintIndex % scenario.hints.length]) {
    return `💡 ${scenario.hints[hintIndex % scenario.hints.length]}`;
  }
  
  return `💡 Try expressing how you feel using "I feel..." or state what you need clearly.`;
};

// ============================================
// EXPORTS
// ============================================

export const AIService = {
  generateResponse: generateAIResponse,
  generateFeedback,
  generateHint: generateContextualHint,
  detectCrisis,
};

export default AIService;
