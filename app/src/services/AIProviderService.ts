// AI Provider Service
// Integrates with OpenAI and Anthropic for real AI-powered roleplay conversations
// Features: Automatic failover, AI-assisted safety detection, smart model selection

import { RoleplayScenario } from '../data/roleplay-scenarios';
import Constants from 'expo-constants';

// ============================================
// CONFIGURATION
// ============================================

type Provider = 'openai' | 'anthropic';
type ModelTier = 'fast' | 'standard' | 'powerful';

interface ProviderConfig {
  apiKey: string;
  models: Record<ModelTier, string>;
  baseUrl: string;
}

interface AIConfig {
  primaryProvider: Provider;
  providers: Record<Provider, ProviderConfig>;
  maxTokens: Record<string, number>;
  temperature: Record<string, number>;
}

const getConfig = (): AIConfig => {
  const openaiKey = Constants.expoConfig?.extra?.openaiApiKey || process.env.OPENAI_API_KEY || '';
  const anthropicKey = Constants.expoConfig?.extra?.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '';
  const primaryProvider = Constants.expoConfig?.extra?.aiProvider || 
    (anthropicKey ? 'anthropic' : 'openai');

  return {
    primaryProvider,
    providers: {
      openai: {
        apiKey: openaiKey,
        models: {
          fast: 'gpt-4o-mini',        // Quick responses, hints
          standard: 'gpt-4o',          // Main roleplay
          powerful: 'gpt-4o',          // Complex feedback
        },
        baseUrl: 'https://api.openai.com/v1',
      },
      anthropic: {
        apiKey: anthropicKey,
        models: {
          fast: 'claude-3-5-haiku-20241022',  // Quick responses
          standard: 'claude-sonnet-4-20250514',    // Main roleplay
          powerful: 'claude-sonnet-4-20250514',    // Complex feedback
        },
        baseUrl: 'https://api.anthropic.com/v1',
      },
    },
    maxTokens: {
      roleplay: 300,
      feedback: 500,
      safetyCheck: 100,
      hint: 150,
    },
    temperature: {
      roleplay: 0.8,
      feedback: 0.5,
      safetyCheck: 0.1,
      hint: 0.7,
    },
  };
};

// Get available providers (those with API keys)
const getAvailableProviders = (config: AIConfig): Provider[] => {
  const available: Provider[] = [];
  if (config.providers.openai.apiKey) available.push('openai');
  if (config.providers.anthropic.apiKey) available.push('anthropic');
  
  // Put primary provider first
  if (available.includes(config.primaryProvider)) {
    return [config.primaryProvider, ...available.filter(p => p !== config.primaryProvider)];
  }
  return available;
};

// ============================================
// SYSTEM PROMPTS
// ============================================

const buildRoleplaySystemPrompt = (
  scenario: RoleplayScenario,
  userAge: number
): string => {
  const ageContext = getAgeContext(userAge);
  
  return `You are a skilled roleplay actor helping someone practice difficult real-world conversations.

## Your Character
Name/Role: ${scenario.persona}
Background: ${scenario.personaDescription}
Personality: ${scenario.personaTraits.join(', ')}

## Scene
${scenario.context}

## Acting Guidelines
- Embody ${scenario.persona} authentically — react to what they say, not a script
- Keep responses SHORT (1-3 sentences) — this is conversation, not monologue
- Style: ${scenario.responseStyle}
- Be believably human — not cartoonishly difficult, not a pushover
- Show subtle emotional shifts based on how they communicate with you

## How to React
When they're dismissive, unclear, or aggressive:
${scenario.escalationTriggers.length > 0 ? scenario.escalationTriggers.map(t => `- ${t}`).join('\n') : '- React naturally — show frustration or confusion without being unreasonable'}

When they're assertive, respectful, and clear:
${scenario.deescalationResponses.length > 0 ? scenario.deescalationResponses.map(d => `- ${d}`).join('\n') : '- Acknowledge it. Show they\'re getting through. People respond to good communication.'}

## User Context
${ageContext}

## Critical Safety Rule
If you detect the user is sharing REAL crisis (not roleplay) — thoughts of self-harm, suicide, or immediate danger — IMMEDIATELY break character:

"[Pausing the roleplay] Hey — what you just shared sounds serious and real. If you're struggling right now, please reach out: 988 (call/text) or text HOME to 741741. These are free and confidential. Are you okay?"

## Your Goal
Help them practice: ${scenario.skillsTargeted.join(', ')}

Now become ${scenario.persona}. Respond only as your character unless there's a safety concern.`;
};

const getAgeContext = (age: number): string => {
  if (age < 14) {
    return `User is ${age} (pre-teen/early teen). Keep language simple and clear. Be patient. They're learning.`;
  } else if (age < 18) {
    return `User is ${age} (teenager). They can handle nuance. Don't talk down to them — they'll notice.`;
  } else if (age < 25) {
    return `User is ${age} (young adult). Full adult conversation. They're practicing real-world scenarios.`;
  } else if (age < 40) {
    return `User is ${age} (adult). They may be working on patterns built over years. Be realistic.`;
  } else {
    return `User is ${age} (experienced adult). Respect their life experience while staying authentic to your character.`;
  }
};

// ============================================
// SAFETY DETECTION - MULTI-LAYER
// ============================================

// Layer 1: Fast keyword/pattern matching
const CRISIS_PATTERNS = [
  // Direct expressions
  /\b(want|going|plan|think about|considering) to (kill|hurt|end|harm) (myself|my life|it all)\b/i,
  /\bsuicid(e|al)\b/i,
  /\bkill myself\b/i,
  /\bend my life\b/i,
  
  // Indirect expressions
  /\bdon'?t want to (live|be here|exist|wake up|be alive)\b/i,
  /\bbetter off (dead|without me|if i (was|were) gone)\b/i,
  /\bno (point|reason) (in |to )?(living|being here|going on)\b/i,
  /\bcan'?t (go on|take it|do this|keep going|handle this) anymore\b/i,
  /\bwant to disappear\b/i,
  /\bnobody would (care|miss me|notice)\b/i,
  /\beveryone (would be|is) better off without me\b/i,
  
  // Self-harm
  /\b(cutting|cut) myself\b/i,
  /\bhurt(ing)? myself\b/i,
  /\bself[- ]?harm\b/i,
  
  // Hopelessness markers
  /\bno way out\b/i,
  /\bno hope\b/i,
  /\bi give up\b/i,
  /\bwhat'?s the point\b/i,
];

// Severity levels
type SafetySeverity = 'none' | 'monitor' | 'concern' | 'crisis';

interface SafetyAssessment {
  severity: SafetySeverity;
  triggered: boolean;
  reason?: string;
  response?: string;
}

// Fast pattern-based detection
export const detectCrisisPatterns = (message: string): SafetyAssessment => {
  const matchedPattern = CRISIS_PATTERNS.find(pattern => pattern.test(message));
  
  if (matchedPattern) {
    return {
      severity: 'crisis',
      triggered: true,
      reason: 'Crisis pattern detected',
      response: CRISIS_RESPONSE,
    };
  }
  
  // Check for concerning but not crisis-level content
  const concerningPatterns = [
    /\b(feeling|feel) (hopeless|worthless|empty|numb)\b/i,
    /\b(hate|hating) (myself|my life)\b/i,
    /\bwish i (wasn'?t|weren'?t) (here|born|alive)\b/i,
    /\bdon'?t (care|matter)\b/i,
  ];
  
  const concernMatch = concerningPatterns.find(p => p.test(message));
  if (concernMatch) {
    return {
      severity: 'concern',
      triggered: false,
      reason: 'Concerning language detected',
    };
  }
  
  return { severity: 'none', triggered: false };
};

// Layer 2: AI-assisted sentiment/intent analysis
const analyzeMessageSafety = async (
  message: string,
  conversationContext: string,
  config: AIConfig
): Promise<SafetyAssessment> => {
  const providers = getAvailableProviders(config);
  if (providers.length === 0) {
    // Fall back to pattern-only
    return detectCrisisPatterns(message);
  }

  const prompt = `Analyze this message from a mental health practice app user for safety concerns.

Context: User is practicing difficult conversations in a roleplay scenario.
${conversationContext}

User's message: "${message}"

Assess if this seems like:
1. Normal roleplay participation (user is acting/practicing)
2. User venting frustration WITH the app/scenario
3. User revealing REAL personal struggles (not roleplay)
4. User in actual crisis needing immediate help

Respond with ONLY a JSON object:
{
  "assessment": "roleplay" | "frustration" | "personal" | "crisis",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

  try {
    const response = await callProviderWithFallback(
      providers,
      config,
      'You are a mental health safety classifier. Respond only with valid JSON.',
      [{ role: 'user', content: prompt }],
      'fast',
      'safetyCheck'
    );

    if (response.error) {
      return detectCrisisPatterns(message);
    }

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.assessment === 'crisis' && parsed.confidence > 0.7) {
        return {
          severity: 'crisis',
          triggered: true,
          reason: parsed.reasoning,
          response: CRISIS_RESPONSE,
        };
      }
      
      if (parsed.assessment === 'personal' && parsed.confidence > 0.6) {
        return {
          severity: 'concern',
          triggered: false,
          reason: parsed.reasoning,
        };
      }
    }
    
    return { severity: 'none', triggered: false };
  } catch (error) {
    console.error('AI safety analysis error:', error);
    return detectCrisisPatterns(message);
  }
};

const CRISIS_RESPONSE = `I want to pause the roleplay for a moment. 

What you're sharing sounds really heavy, and I want to make sure you're okay — like, actually okay.

If you're having thoughts of hurting yourself, please reach out:
• **988** — Suicide & Crisis Lifeline (call or text, 24/7)
• **Text HOME to 741741** — Crisis Text Line

These are free, confidential, and staffed by real people who care.

Are you safe right now? If this was just part of the roleplay and you're okay, let me know and we can continue. If you're actually struggling, that's okay to say too. 💜`;

const GENTLE_CHECKIN = `Hey, I noticed some of what you're saying sounds heavy. Just checking in — are you doing okay? 

If you're working through real stuff, that's valid. This is a safe space. And if you ever need to talk to someone, 988 is always there (call or text).

Want to keep practicing, or do you need a break?`;

// ============================================
// API CALLS WITH FAILOVER
// ============================================

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface APIResponse {
  content: string;
  provider: Provider;
  model: string;
  error?: string;
}

const callOpenAI = async (
  config: ProviderConfig,
  systemPrompt: string,
  messages: Message[],
  model: string,
  maxTokens: number,
  temperature: number
): Promise<APIResponse> => {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    provider: 'openai',
    model,
  };
};

const callAnthropic = async (
  config: ProviderConfig,
  systemPrompt: string,
  messages: Message[],
  model: string,
  maxTokens: number,
  temperature: number
): Promise<APIResponse> => {
  const response = await fetch(`${config.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    provider: 'anthropic',
    model,
  };
};

// Main call function with automatic failover
const callProviderWithFallback = async (
  providers: Provider[],
  config: AIConfig,
  systemPrompt: string,
  messages: Message[],
  tier: ModelTier,
  task: string
): Promise<APIResponse> => {
  const maxTokens = config.maxTokens[task] || 300;
  const temperature = config.temperature[task] || 0.7;
  
  let lastError: Error | null = null;
  
  for (const provider of providers) {
    const providerConfig = config.providers[provider];
    const model = providerConfig.models[tier];
    
    try {
      if (provider === 'openai') {
        return await callOpenAI(providerConfig, systemPrompt, messages, model, maxTokens, temperature);
      } else {
        return await callAnthropic(providerConfig, systemPrompt, messages, model, maxTokens, temperature);
      }
    } catch (error) {
      console.warn(`${provider} failed, trying next provider...`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  
  // All providers failed
  return {
    content: '',
    provider: providers[0] || 'openai',
    model: '',
    error: lastError?.message || 'All AI providers failed',
  };
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
  enableAISafetyAnalysis?: boolean; // Whether to use AI for safety (costs tokens)
}

export interface GenerateResponseResult {
  content: string;
  safetyTriggered: boolean;
  safetySeverity: SafetySeverity;
  provider?: Provider;
  model?: string;
  error?: string;
}

export const generateAIResponse = async (
  params: GenerateResponseParams
): Promise<GenerateResponseResult> => {
  const { 
    scenario, 
    conversationHistory, 
    userMessage, 
    userAge,
    enableAISafetyAnalysis = true 
  } = params;
  
  const config = getConfig();
  const providers = getAvailableProviders(config);
  
  // Layer 1: Fast pattern check (always runs)
  const patternCheck = detectCrisisPatterns(userMessage);
  if (patternCheck.triggered) {
    return {
      content: patternCheck.response!,
      safetyTriggered: true,
      safetySeverity: patternCheck.severity,
    };
  }
  
  // Layer 2: AI safety analysis for concerning content
  if (enableAISafetyAnalysis && patternCheck.severity === 'concern' && providers.length > 0) {
    const contextSummary = conversationHistory.length > 0
      ? `Recent conversation: ${conversationHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join(' | ')}`
      : 'This is the start of the conversation.';
    
    const aiSafetyCheck = await analyzeMessageSafety(userMessage, contextSummary, config);
    if (aiSafetyCheck.triggered) {
      return {
        content: aiSafetyCheck.response!,
        safetyTriggered: true,
        safetySeverity: aiSafetyCheck.severity,
      };
    }
    
    // Not crisis, but concerning — add gentle check-in after response
    if (aiSafetyCheck.severity === 'concern') {
      // Continue with roleplay but flag for potential follow-up
    }
  }
  
  // Check scenario-specific safety triggers
  const scenarioTrigger = scenario.safetyTriggers.find(trigger =>
    userMessage.toLowerCase().includes(trigger.toLowerCase())
  );
  if (scenarioTrigger) {
    return {
      content: CRISIS_RESPONSE,
      safetyTriggered: true,
      safetySeverity: 'crisis',
    };
  }
  
  // No providers available
  if (providers.length === 0) {
    return {
      content: "I couldn't connect to the AI service. Please check your API configuration in settings.",
      safetyTriggered: false,
      safetySeverity: 'none',
      error: 'No API keys configured',
    };
  }
  
  // Build messages for API
  const messages: Message[] = conversationHistory.map(m => ({
    role: m.role === 'ai' ? 'assistant' : 'user',
    content: m.content,
  }));
  messages.push({ role: 'user', content: userMessage });
  
  // Build system prompt
  const systemPrompt = buildRoleplaySystemPrompt(scenario, userAge);
  
  // Call AI with failover
  const response = await callProviderWithFallback(
    providers,
    config,
    systemPrompt,
    messages,
    'standard',
    'roleplay'
  );
  
  if (response.error) {
    return {
      content: "I had trouble generating a response. Let's try again?",
      safetyTriggered: false,
      safetySeverity: 'none',
      error: response.error,
    };
  }
  
  return {
    content: response.content,
    safetyTriggered: false,
    safetySeverity: patternCheck.severity, // Pass through concern level
    provider: response.provider,
    model: response.model,
  };
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
  skillsObserved: string[];
}

const buildFeedbackPrompt = (
  scenario: RoleplayScenario,
  conversationHistory: ConversationMessage[],
  userAge: number
): string => {
  const conversation = conversationHistory
    .map((m, i) => `${m.role === 'user' ? 'User' : scenario.persona}: "${m.content}"`)
    .join('\n');
  
  return `You are a warm, encouraging communication coach. Analyze this practice conversation and give helpful feedback.

## The Scenario
"${scenario.title}"
Skills being practiced: ${scenario.skillsTargeted.join(', ')}

## What Good Looks Like
${scenario.goodResponses.map(r => `- "${r}"`).join('\n')}

## Common Pitfalls
${scenario.commonMistakes.map(m => `- ${m}`).join('\n')}

## The Conversation
${conversation}

## User's Age: ${userAge}
Adjust your feedback tone and complexity appropriately.

## Your Task
Give specific, actionable feedback. Be encouraging but honest. Highlight what worked AND what could be stronger.

Respond with ONLY this JSON (no markdown, no extra text):
{
  "strengths": ["specific thing they did well", "another strength", "third if applicable"],
  "growthAreas": ["specific area to work on", "another if needed"],
  "suggestion": "One concrete thing to try next time — be specific",
  "overallScore": 4,
  "detailedFeedback": "2-3 sentences of personalized, warm feedback that acknowledges their effort and gives them something to think about",
  "skillsObserved": ["assertiveness", "I-statements", etc]
}

Scoring guide:
- 1-2: Struggled significantly, needs fundamentals
- 3: Good effort, clear areas to develop
- 4: Strong performance with minor improvements possible
- 5: Excellent — hit the key skills naturally

Be their coach, not their critic. Start with what worked.`;
};

export const generateFeedback = async (
  params: FeedbackParams
): Promise<FeedbackResult> => {
  const { scenario, conversationHistory, userAge } = params;
  const config = getConfig();
  const providers = getAvailableProviders(config);
  
  if (providers.length === 0 || conversationHistory.length === 0) {
    return generateFallbackFeedback(scenario, conversationHistory, userAge);
  }
  
  const prompt = buildFeedbackPrompt(scenario, conversationHistory, userAge);
  
  try {
    const response = await callProviderWithFallback(
      providers,
      config,
      'You are a supportive communication coach. Respond only with valid JSON, no markdown formatting.',
      [{ role: 'user', content: prompt }],
      'powerful', // Use more capable model for nuanced feedback
      'feedback'
    );
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        strengths: parsed.strengths || [],
        growthAreas: parsed.growthAreas || [],
        suggestion: parsed.suggestion || 'Keep practicing!',
        overallScore: Math.min(5, Math.max(1, parsed.overallScore || 3)),
        detailedFeedback: parsed.detailedFeedback || '',
        skillsObserved: parsed.skillsObserved || scenario.skillsTargeted,
      };
    }
    
    throw new Error('Could not parse feedback JSON');
  } catch (error) {
    console.error('Feedback generation error:', error);
    return generateFallbackFeedback(scenario, conversationHistory, userAge);
  }
};

// Improved fallback with better analysis
const generateFallbackFeedback = (
  scenario: RoleplayScenario,
  conversationHistory: ConversationMessage[],
  userAge: number
): FeedbackResult => {
  const userMessages = conversationHistory.filter(m => m.role === 'user');
  const allUserText = userMessages.map(m => m.content.toLowerCase()).join(' ');
  
  // Analyze communication patterns
  const patterns = {
    usedIStatements: /\bi (feel|need|want|think|believe)\b/.test(allUserText),
    wasAssertive: /\b(no|i don'?t|i won'?t|my boundary|not okay)\b/.test(allUserText),
    askedQuestions: userMessages.some(m => m.content.includes('?')),
    stayedCalm: !userMessages.some(m => m.content.includes('!') && m.content.length < 15),
    gaveContext: userMessages.some(m => m.content.length > 50),
    usedBecause: /\bbecause\b/.test(allUserText),
  };
  
  const strengths: string[] = [];
  const growthAreas: string[] = [];
  const skillsObserved: string[] = [];
  
  // Build feedback based on patterns
  if (patterns.usedIStatements) {
    strengths.push('You used "I" statements to express your feelings');
    skillsObserved.push('I-statements');
  }
  if (patterns.wasAssertive) {
    strengths.push('You were clear and direct about your position');
    skillsObserved.push('assertiveness');
  }
  if (patterns.askedQuestions) {
    strengths.push('You asked questions to understand the other person');
    skillsObserved.push('active listening');
  }
  if (patterns.stayedCalm) {
    strengths.push('You kept a calm, measured tone');
    skillsObserved.push('emotional regulation');
  }
  if (patterns.gaveContext) {
    strengths.push('You provided context for your perspective');
  }
  
  // Ensure at least one strength
  if (strengths.length === 0) {
    strengths.push('You engaged with the practice scenario');
    strengths.push('You completed the conversation');
  }
  
  // Growth areas
  if (!patterns.usedIStatements) {
    growthAreas.push('Try using "I feel..." statements to express emotions');
  }
  if (!patterns.wasAssertive) {
    growthAreas.push('Practice being more direct about what you need');
  }
  if (!patterns.usedBecause && !patterns.gaveContext) {
    growthAreas.push('Give a brief reason for your boundary — one is enough');
  }
  if (growthAreas.length === 0) {
    growthAreas.push('Keep practicing to build confidence');
  }
  
  // Calculate score
  const patternScore = Object.values(patterns).filter(Boolean).length;
  const score = Math.min(5, Math.max(2, Math.round(patternScore / 2) + 2));
  
  // Age-appropriate suggestion
  let suggestion: string;
  if (userAge < 14) {
    suggestion = "Next time, try: 'I need you to [specific thing].' Short and clear works great!";
  } else if (userAge < 18) {
    suggestion = "Try the 'broken record' technique — calmly repeat your boundary without adding new explanations.";
  } else {
    suggestion = "Notice when you're over-explaining. One reason is enough. 'No' is a complete sentence.";
  }
  
  return {
    strengths: strengths.slice(0, 3),
    growthAreas: growthAreas.slice(0, 2),
    suggestion,
    overallScore: score,
    detailedFeedback: `You completed the practice scenario — that takes courage! ${strengths[0] || 'You showed up and tried'}. ${growthAreas.length > 0 ? `For next time, focus on: ${growthAreas[0].toLowerCase()}.` : ''} Every conversation you practice builds real-world skills.`,
    skillsObserved: skillsObserved.length > 0 ? skillsObserved : scenario.skillsTargeted.slice(0, 2),
  };
};

// ============================================
// HINT GENERATION
// ============================================

export interface HintParams {
  scenario: RoleplayScenario;
  conversationHistory: ConversationMessage[];
  userAge: number;
  hintIndex: number;
}

export const generateContextualHint = async (
  params: HintParams
): Promise<string> => {
  const { scenario, conversationHistory, userAge, hintIndex } = params;
  const config = getConfig();
  const providers = getAvailableProviders(config);
  
  // Try scenario-specific hints first
  if (scenario.hints[hintIndex % scenario.hints.length]) {
    return `💡 ${scenario.hints[hintIndex % scenario.hints.length]}`;
  }
  
  // If we have providers, generate contextual hint
  if (providers.length > 0 && conversationHistory.length > 0) {
    const lastAIMessage = [...conversationHistory].reverse().find(m => m.role === 'ai');
    
    if (lastAIMessage) {
      try {
        const response = await callProviderWithFallback(
          providers,
          config,
          'You are a communication coach giving quick hints. Be brief and specific.',
          [{
            role: 'user',
            content: `The user (age ${userAge}) is practicing "${scenario.title}". 
            
The other person just said: "${lastAIMessage.content}"

Give ONE short, specific hint (max 15 words) for how to respond effectively. Focus on the skill: ${scenario.skillsTargeted[0]}.

Format: Just the hint text, no emoji, no "try" or "hint:" prefix.`
          }],
          'fast',
          'hint'
        );
        
        if (!response.error && response.content) {
          return `💡 ${response.content.trim()}`;
        }
      } catch (error) {
        console.error('Hint generation error:', error);
      }
    }
  }
  
  // Fallback hints
  const fallbackHints = [
    'Express how you feel using "I feel..." statements',
    'State what you need clearly and directly',
    'You can say no without over-explaining',
    'Ask a question to understand their perspective',
    'Stay calm — you don\'t have to match their energy',
  ];
  
  return `💡 ${fallbackHints[hintIndex % fallbackHints.length]}`;
};

// ============================================
// UTILITY: Check API Configuration
// ============================================

export interface APIStatus {
  configured: boolean;
  providers: {
    openai: boolean;
    anthropic: boolean;
  };
  primary: Provider | null;
}

export const checkAPIStatus = (): APIStatus => {
  const config = getConfig();
  const providers = getAvailableProviders(config);
  
  return {
    configured: providers.length > 0,
    providers: {
      openai: !!config.providers.openai.apiKey,
      anthropic: !!config.providers.anthropic.apiKey,
    },
    primary: providers[0] || null,
  };
};

// ============================================
// EXPORTS
// ============================================

export const AIService = {
  generateResponse: generateAIResponse,
  generateFeedback,
  generateHint: generateContextualHint,
  detectCrisis: detectCrisisPatterns,
  checkStatus: checkAPIStatus,
};

export default AIService;
