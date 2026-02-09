// Roleplay AI Service
// Orchestrates AI responses with offline fallback
// Uses AIProviderService when online, dialogue trees when offline

import { RoleplayScenario } from '../data/roleplay-scenarios';
import AIProviderService, { 
  AIService, 
  detectCrisisPatterns,
  checkAPIStatus,
  ConversationMessage,
  GenerateResponseResult,
  FeedbackResult as ProviderFeedbackResult,
} from './AIProviderService';

// ============================================
// TYPES
// ============================================

export interface AIResponse {
  content: string;
  shouldPause: boolean;
  shouldEnd: boolean;
  safetyTriggered: boolean;
  safetySeverity: 'none' | 'monitor' | 'concern' | 'crisis';
  sentiment: 'positive' | 'neutral' | 'negative' | 'escalating';
  isOnline: boolean;
}

export interface FeedbackResult {
  strengths: string[];
  growthAreas: string[];
  skillsUsed: string[];
  overallScore: number;
  suggestion: string;
  specificFeedback: string[];
  detailedFeedback?: string;
}

export interface ConversationContext {
  scenario: RoleplayScenario;
  messages: Array<{ role: 'user' | 'ai' | 'system'; content: string }>;
  turnCount: number;
  userAge: number;
  hintsUsed: number;
  preferOffline?: boolean;
}

// Re-export safety detection for backward compatibility
export { detectCrisisPatterns as detectCrisis } from './AIProviderService';

// ============================================
// SAFETY DETECTION (Unified)
// ============================================

const SAFETY_RESPONSE = `Hey — I want to pause for a second. What you just said sounds really heavy, and I want to make sure you're okay.

If you're having thoughts of hurting yourself, please reach out:
• **988** — Call or text (24/7 Suicide & Crisis Lifeline)
• **Text HOME to 741741** — Crisis Text Line

Are you safe right now? If this is about the roleplay, we can keep practicing. If it's about you, let's talk — or get you connected with someone who can really help. 💜`;

export const checkSafetyTriggers = (
  message: string, 
  scenario: RoleplayScenario
): { triggered: boolean; severity: 'none' | 'concern' | 'crisis' } => {
  // Use unified crisis detection
  const crisisCheck = detectCrisisPatterns(message);
  
  if (crisisCheck.triggered) {
    return { triggered: true, severity: 'crisis' };
  }
  
  // Check scenario-specific triggers
  const scenarioTriggered = scenario.safetyTriggers.some(trigger => 
    message.toLowerCase().includes(trigger.toLowerCase())
  );
  
  if (scenarioTriggered) {
    return { triggered: true, severity: 'crisis' };
  }
  
  return { triggered: false, severity: crisisCheck.severity };
};

// ============================================
// DIALOGUE TREES (Offline Fallback)
// ============================================

interface DialogueNode {
  responses: string[];
  keywords?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  nextNode?: string;
}

interface DialogueTree {
  [nodeId: string]: DialogueNode;
}

// Enhanced dialogue progressions based on scenario type
const DIALOGUE_TREES: Record<string, DialogueTree> = {
  'peer-pressure': {
    initial: {
      responses: [
        "Come on, everyone's doing it. Don't be weird about it.",
        "It's not a big deal. Just try it once.",
        "I thought you were cool. Don't be lame.",
      ],
    },
    afterFirstNo: {
      responses: [
        "Why are you being like this? I thought we were friends.",
        "No one's gonna find out. Stop being paranoid.",
        "You're making this awkward for everyone.",
      ],
      keywords: ['no', 'don\'t', 'not', 'pass', 'nah'],
    },
    persistent: {
      responses: [
        "Whatever, more for us I guess.",
        "Fine, be that way. Your loss.",
        "I didn't think you'd be such a buzzkill.",
      ],
    },
    respectful: {
      responses: [
        "Alright, alright, I get it. Sorry for pushing.",
        "Respect for sticking to what you want, honestly.",
        "Fair enough. You do you. No hard feelings.",
      ],
      keywords: ['respect', 'boundary', 'decision', 'my choice'],
      sentiment: 'positive',
    },
  },
  'asking-for-help': {
    initial: {
      responses: [
        "What do you mean? What's going on?",
        "I'm listening. Tell me what's up.",
        "Is everything okay? You seem... off.",
      ],
    },
    afterDisclosure: {
      responses: [
        "I had no idea. How long has this been happening?",
        "Thank you for telling me. That took guts.",
        "I'm glad you trust me with this. Seriously.",
      ],
      sentiment: 'positive',
    },
    maybeDefensive: {
      responses: [
        "Why didn't you say something sooner?",
        "Are you sure it's that serious though?",
        "I mean... I don't really know what to do with this.",
      ],
      sentiment: 'negative',
    },
    supportive: {
      responses: [
        "What do you need from me right now? I'm here.",
        "We'll figure this out together. You're not alone.",
        "I've got your back. What's the first step?",
      ],
      sentiment: 'positive',
    },
  },
  'setting-boundary': {
    initial: {
      responses: [
        "Wait, what do you mean? I don't get it.",
        "Are you serious right now?",
        "Huh. I didn't realize it bothered you.",
      ],
    },
    pushback: {
      responses: [
        "You're being kinda sensitive about this.",
        "It's really not a big deal, why are you making it one?",
        "I've literally always done this. Why is it a problem now?",
      ],
      keywords: ['sensitive', 'dramatic', 'overreacting'],
      sentiment: 'negative',
    },
    testing: {
      responses: [
        "But what if I really, really need to?",
        "Can't you just make an exception this once?",
        "What about in emergencies though?",
      ],
    },
    accepting: {
      responses: [
        "Okay. I hear you. I'll work on it.",
        "I didn't realize how it landed. I'm sorry.",
        "Fair enough. I can respect that.",
      ],
      sentiment: 'positive',
    },
  },
  'conflict-resolution': {
    initial: {
      responses: [
        "So... you want to actually talk about it now?",
        "What is there to even talk about?",
        "Fine. What's on your mind?",
      ],
    },
    defensive: {
      responses: [
        "You always do this. Make me out to be the bad guy.",
        "Oh, so what about what YOU did?",
        "I don't see how this is my fault.",
      ],
      sentiment: 'negative',
    },
    opening: {
      responses: [
        "I guess I can kind of see your point...",
        "I didn't think about it that way before.",
        "Help me understand where you're coming from.",
      ],
      sentiment: 'positive',
    },
    resolution: {
      responses: [
        "Look, I'm sorry. I shouldn't have done that.",
        "Can we figure out how to move past this?",
        "I don't want to fight. I want to fix this.",
      ],
      sentiment: 'positive',
    },
  },
  'family-conflict': {
    initial: {
      responses: [
        "We're not discussing this again.",
        "You know how I feel about this already.",
        "What now?",
      ],
    },
    dismissive: {
      responses: [
        "When you're older, you'll understand.",
        "This is just how things are in our family.",
        "I don't have time for this conversation.",
      ],
      sentiment: 'negative',
    },
    listening: {
      responses: [
        "I'm listening. Go ahead.",
        "I didn't know you felt that way.",
        "Tell me more about what you mean.",
      ],
      sentiment: 'positive',
    },
  },
  'romantic-boundary': {
    initial: {
      responses: [
        "What? I thought we were fine.",
        "Where is this coming from?",
        "I don't understand what you want from me.",
      ],
    },
    defensive: {
      responses: [
        "So what, I'm not allowed to do anything now?",
        "You're being controlling.",
        "I feel like I can't do anything right.",
      ],
      sentiment: 'negative',
    },
    receptive: {
      responses: [
        "I didn't realize it was bothering you that much.",
        "I want to understand. Can you explain more?",
        "That's fair. I should have asked.",
      ],
      sentiment: 'positive',
    },
  },
};

// ============================================
// MESSAGE ANALYSIS
// ============================================

interface MessageAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative' | 'escalating';
  isAssertive: boolean;
  isApologetic: boolean;
  isResolution: boolean;
  keywords: string[];
  patterns: {
    usedIStatements: boolean;
    askedQuestion: boolean;
    setCleanBoundary: boolean;
    overExplained: boolean;
  };
}

const analyzeUserMessage = (
  message: string, 
  scenario: RoleplayScenario
): MessageAnalysis => {
  const lowerMessage = message.toLowerCase();
  
  // Assertive language detection
  const assertivePatterns = [
    'i need', 'i want', 'i feel', 'no', 'i don\'t', 'i won\'t',
    'my boundary', 'not okay', 'respect', 'please stop', 'i expect'
  ];
  const isAssertive = assertivePatterns.some(p => lowerMessage.includes(p));
  
  // Apologetic/backing down language
  const apologeticPatterns = [
    'sorry', 'i guess', 'maybe i', 'never mind', 'it\'s fine', 'forget it',
    'i\'m just', 'it\'s okay', 'if you think', 'whatever you want', 'i suppose'
  ];
  const isApologetic = apologeticPatterns.some(p => lowerMessage.includes(p));
  
  // Resolution language
  const resolutionPatterns = [
    'thank you', 'i appreciate', 'we can', 'let\'s', 'together',
    'understand', 'okay', 'agree', 'deal'
  ];
  const isResolution = resolutionPatterns.some(p => lowerMessage.includes(p)) &&
    (isAssertive || message.includes('?'));
  
  // Pattern detection
  const patterns = {
    usedIStatements: /\bi (feel|need|want|think|believe|am)\b/.test(lowerMessage),
    askedQuestion: message.includes('?'),
    setCleanBoundary: /\b(no|i (don't|won't|can't))\b/.test(lowerMessage) && 
      !isApologetic,
    overExplained: message.split(/[.!?]/).length > 3 || message.length > 200,
  };
  
  // Determine overall sentiment
  let sentiment: MessageAnalysis['sentiment'] = 'neutral';
  if (isAssertive && !isApologetic) sentiment = 'positive';
  if (isApologetic && !isAssertive) sentiment = 'negative';
  if ((message.match(/!/g)?.length || 0) > 1 || message === message.toUpperCase()) {
    sentiment = 'escalating';
  }
  
  return {
    sentiment,
    isAssertive,
    isApologetic,
    isResolution,
    keywords: extractKeywords(message),
    patterns,
  };
};

const extractKeywords = (message: string): string[] => {
  const words = message.toLowerCase().split(/\s+/);
  const stopWords = ['i', 'you', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 
    'to', 'of', 'and', 'but', 'or', 'that', 'this', 'it', 'for', 'on', 'with'];
  return words.filter(w => !stopWords.includes(w) && w.length > 2);
};

// ============================================
// OFFLINE RESPONSE GENERATION
// ============================================

const selectOfflineResponse = (
  scenario: RoleplayScenario,
  turn: number,
  analysis: MessageAnalysis
): string => {
  const treeType = getDialogueTreeType(scenario.category);
  const tree = DIALOGUE_TREES[treeType];
  
  if (!tree) {
    return getGenericResponse(turn, analysis, scenario);
  }
  
  // Select node based on turn and analysis
  let node: DialogueNode;
  
  if (turn === 0) {
    node = tree.initial;
  } else if (analysis.sentiment === 'positive' && analysis.isAssertive) {
    // Good communication — character starts to respond positively
    node = tree.accepting || tree.supportive || tree.resolution || tree.respectful;
    if (!node) node = tree.initial;
  } else if (analysis.sentiment === 'negative' || analysis.isApologetic) {
    // User backing down — character might push harder
    node = tree.pushback || tree.defensive || tree.persistent;
    if (!node) node = tree.initial;
  } else if (turn >= 3 && tree.resolution) {
    // Late in conversation — move toward resolution
    node = tree.resolution || tree.accepting;
    if (!node) node = tree.initial;
  } else {
    // Mid-conversation progression
    const orderedNodes = ['initial', 'afterFirstNo', 'persistent', 'testing'];
    const nodeKey = orderedNodes[Math.min(turn, orderedNodes.length - 1)];
    node = tree[nodeKey] || tree.initial;
  }
  
  // Select random response from node
  return node.responses[Math.floor(Math.random() * node.responses.length)];
};

const getDialogueTreeType = (category: string): string => {
  const mapping: Record<string, string> = {
    'substances': 'peer-pressure',
    'peer-pressure': 'peer-pressure',
    'mental-health': 'asking-for-help',
    'asking-for-help': 'asking-for-help',
    'boundaries': 'setting-boundary',
    'setting-boundary': 'setting-boundary',
    'conflict': 'conflict-resolution',
    'conflict-resolution': 'conflict-resolution',
    'friends': 'setting-boundary',
    'family': 'family-conflict',
    'romantic': 'romantic-boundary',
    'school': 'asking-for-help',
    'work': 'setting-boundary',
    'self-advocacy': 'asking-for-help',
  };
  return mapping[category] || 'conflict-resolution';
};

const getGenericResponse = (
  turn: number,
  analysis: MessageAnalysis,
  scenario: RoleplayScenario
): string => {
  const genericByTurnAndSentiment: Record<string, string[][]> = {
    positive: [
      ["Okay...", "Go on.", "I'm listening."],
      ["Huh. I hadn't thought of it that way.", "Fair point.", "I see what you mean."],
      ["You're right. I hear you.", "Okay, I can respect that.", "That makes sense."],
    ],
    negative: [
      ["What?", "Where is this coming from?", "I don't get it."],
      ["That's not how I see it.", "Really?", "Are you sure about that?"],
      ["I guess...", "If you say so.", "Whatever."],
    ],
    neutral: [
      ["What do you mean by that?", "Can you say more?", "I'm listening."],
      ["Okay.", "I hear you.", "Uh huh."],
      ["Alright.", "Let me think about that.", "I understand."],
    ],
  };
  
  const sentimentKey = analysis.sentiment === 'escalating' ? 'negative' : analysis.sentiment;
  const responses = genericByTurnAndSentiment[sentimentKey] || genericByTurnAndSentiment.neutral;
  const stage = Math.min(Math.floor(turn / 2), 2);
  
  return responses[stage][Math.floor(Math.random() * responses[stage].length)];
};

// ============================================
// MAIN RESPONSE GENERATION
// ============================================

export const generateAIResponse = async (
  userMessage: string,
  context: ConversationContext
): Promise<AIResponse> => {
  const { scenario, messages, turnCount, userAge, preferOffline } = context;
  
  // Check for safety triggers first (always, even offline)
  const safetyCheck = checkSafetyTriggers(userMessage, scenario);
  if (safetyCheck.triggered) {
    return {
      content: SAFETY_RESPONSE,
      shouldPause: true,
      shouldEnd: false,
      safetyTriggered: true,
      safetySeverity: safetyCheck.severity,
      sentiment: 'neutral',
      isOnline: false,
    };
  }
  
  // Analyze user message (used by both online and offline)
  const analysis = analyzeUserMessage(userMessage, scenario);
  
  // Check if we should use online AI
  const apiStatus = checkAPIStatus();
  const useOnline = apiStatus.configured && !preferOffline;
  
  if (useOnline) {
    try {
      // Convert messages to provider format
      const conversationHistory: ConversationMessage[] = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'ai',
          content: m.content,
        }));
      
      const result = await AIService.generateResponse({
        scenario,
        conversationHistory,
        userMessage,
        userAge,
        enableAISafetyAnalysis: true,
      });
      
      if (!result.error) {
        return {
          content: result.content,
          shouldPause: result.safetyTriggered,
          shouldEnd: turnCount >= 5 && analysis.isResolution,
          safetyTriggered: result.safetyTriggered,
          safetySeverity: result.safetySeverity,
          sentiment: analysis.sentiment,
          isOnline: true,
        };
      }
      
      // Fall through to offline if there was an error
      console.warn('Online AI failed, falling back to offline:', result.error);
    } catch (error) {
      console.error('Online AI error:', error);
    }
  }
  
  // Offline fallback
  const offlineResponse = selectOfflineResponse(scenario, turnCount, analysis);
  const shouldEnd = turnCount >= 5 || analysis.isResolution;
  
  return {
    content: offlineResponse,
    shouldPause: false,
    shouldEnd,
    safetyTriggered: false,
    safetySeverity: safetyCheck.severity,
    sentiment: analysis.sentiment,
    isOnline: false,
  };
};

// ============================================
// FEEDBACK GENERATION
// ============================================

export const generateFeedback = async (
  context: ConversationContext
): Promise<FeedbackResult> => {
  const { scenario, messages, userAge } = context;
  const userMessages = messages.filter(m => m.role === 'user');
  
  // Try online feedback first
  const apiStatus = checkAPIStatus();
  
  if (apiStatus.configured) {
    try {
      const conversationHistory: ConversationMessage[] = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'ai',
          content: m.content,
        }));
      
      const result = await AIService.generateFeedback({
        scenario,
        conversationHistory,
        userAge,
      });
      
      return {
        strengths: result.strengths,
        growthAreas: result.growthAreas,
        skillsUsed: result.skillsObserved || scenario.skillsTargeted,
        overallScore: result.overallScore,
        suggestion: result.suggestion,
        specificFeedback: [], // Provider doesn't return this format
        detailedFeedback: result.detailedFeedback,
      };
    } catch (error) {
      console.error('Online feedback error:', error);
    }
  }
  
  // Offline feedback generation
  return generateOfflineFeedback(scenario, userMessages, userAge);
};

const generateOfflineFeedback = (
  scenario: RoleplayScenario,
  userMessages: Array<{ content: string }>,
  userAge: number
): FeedbackResult => {
  // Analyze all user responses
  const analyses = userMessages.map(m => analyzeUserMessage(m.content, scenario));
  
  // Calculate metrics
  const assertiveCount = analyses.filter(a => a.isAssertive).length;
  const apologeticCount = analyses.filter(a => a.isApologetic).length;
  const totalTurns = userMessages.length || 1;
  
  // Pattern usage
  const usedIStatements = analyses.some(a => a.patterns.usedIStatements);
  const askedQuestions = analyses.some(a => a.patterns.askedQuestion);
  const setClearBoundary = analyses.some(a => a.patterns.setCleanBoundary);
  const overExplained = analyses.some(a => a.patterns.overExplained);
  
  // Generate strengths
  const strengths: string[] = [];
  
  if (assertiveCount >= totalTurns / 2) {
    strengths.push("You were clear and direct about your needs");
  }
  if (usedIStatements) {
    strengths.push('You used "I" statements to express yourself');
  }
  if (askedQuestions) {
    strengths.push("You asked questions to understand the other person");
  }
  if (!analyses.some(a => a.sentiment === 'escalating')) {
    strengths.push("You stayed calm throughout the conversation");
  }
  if (setClearBoundary) {
    strengths.push("You set a clear boundary without over-justifying");
  }
  
  // Default strengths
  if (strengths.length === 0) {
    strengths.push("You engaged with the scenario");
    strengths.push("You practiced a difficult conversation");
  }
  
  // Generate growth areas
  const growthAreas: string[] = [];
  
  if (apologeticCount > assertiveCount) {
    growthAreas.push("You apologized more than necessary — your needs are valid");
  }
  if (analyses.every(a => !a.isAssertive)) {
    growthAreas.push("Try being more direct about what you need");
  }
  if (userMessages.some(m => m.content.length < 10)) {
    growthAreas.push("Expand on your responses — give context for your feelings");
  }
  if (overExplained) {
    growthAreas.push("You don't need to justify your boundaries so much — one reason is enough");
  }
  if (!usedIStatements) {
    growthAreas.push('Try using "I feel..." statements to express emotions');
  }
  
  if (growthAreas.length === 0) {
    growthAreas.push("Keep practicing — confidence builds with repetition");
  }
  
  // Calculate score
  let score = 3;
  if (assertiveCount >= totalTurns / 2) score += 0.5;
  if (apologeticCount < totalTurns / 3) score += 0.5;
  if (usedIStatements) score += 0.5;
  if (setClearBoundary) score += 0.5;
  if (overExplained) score -= 0.5;
  score = Math.min(5, Math.max(1, Math.round(score)));
  
  // Age-sensitive suggestion
  const suggestion = generateAgeSensitiveSuggestion(userAge, analyses, scenario);
  
  // Specific feedback comparing to good/bad examples
  const specificFeedback = generateSpecificFeedback(userMessages, scenario);
  
  return {
    strengths: strengths.slice(0, 3),
    growthAreas: growthAreas.slice(0, 2),
    skillsUsed: scenario.skillsTargeted.slice(0, 3),
    overallScore: score,
    suggestion,
    specificFeedback,
  };
};

const generateAgeSensitiveSuggestion = (
  age: number,
  analyses: MessageAnalysis[],
  scenario: RoleplayScenario
): string => {
  const wasApologetic = analyses.some(a => a.isApologetic);
  const overExplained = analyses.some(a => a.patterns.overExplained);
  
  if (age < 14) {
    // Concrete, simple
    if (wasApologetic) {
      return "Next time, try saying what you need without 'sorry'. Like: 'I need you to stop.'";
    }
    return "Try saying exactly what you need in one sentence. Short and clear works great!";
  } else if (age < 18) {
    if (overExplained) {
      return "Try the 'broken record' technique — calmly repeat your boundary without adding new explanations.";
    }
    if (wasApologetic) {
      return "Notice when you apologize for having boundaries. You don't owe anyone an apology for your needs.";
    }
    return "Practice the DEAR MAN skill: Describe, Express, Assert, Reinforce. It helps you ask clearly.";
  } else if (age < 25) {
    if (overExplained) {
      return "Notice the difference between explaining (once) and over-explaining (multiple times). One reason is enough.";
    }
    return "Remember: 'No' is a complete sentence. You can always add context, but you don't have to.";
  } else {
    if (wasApologetic) {
      return "Consider what you're protecting when you over-apologize. Sometimes we manage others' emotions instead of advocating for ourselves.";
    }
    return "Your boundaries aren't requests — they're information about how you operate. State them, don't negotiate them.";
  }
};

const generateSpecificFeedback = (
  userMessages: Array<{ content: string }>,
  scenario: RoleplayScenario
): string[] => {
  const feedback: string[] = [];
  
  // Compare to good responses
  const goodPatterns = scenario.goodResponses.flatMap(r => 
    r.toLowerCase().split(/\s+/).filter(w => w.length > 4)
  );
  
  userMessages.forEach((msg, i) => {
    const lowerMsg = msg.content.toLowerCase();
    
    // Check for common mistakes
    scenario.commonMistakes.forEach(mistake => {
      const mistakeWords = mistake.toLowerCase().split(/\s+/);
      if (mistakeWords.some(w => lowerMsg.includes(w) && w.length > 4)) {
        feedback.push(`Response ${i + 1}: Watch out for "${mistake}"`);
      }
    });
    
    // Check for good elements
    const usedGoodPattern = goodPatterns.filter(p => lowerMsg.includes(p));
    if (usedGoodPattern.length > 0) {
      feedback.push(`Response ${i + 1}: Good use of clear language`);
    }
  });
  
  return feedback.slice(0, 3);
};

// ============================================
// HINT SYSTEM
// ============================================

export const getHint = async (
  scenario: RoleplayScenario,
  context: ConversationContext
): Promise<string> => {
  const { messages, userAge, hintsUsed } = context;
  
  // Try contextual AI hint first
  const apiStatus = checkAPIStatus();
  
  if (apiStatus.configured) {
    try {
      const conversationHistory: ConversationMessage[] = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'ai',
          content: m.content,
        }));
      
      return await AIService.generateHint({
        scenario,
        conversationHistory,
        userAge,
        hintIndex: hintsUsed,
      });
    } catch (error) {
      console.error('Hint generation error:', error);
    }
  }
  
  // Fallback to scenario hints
  const hints = scenario.hints;
  const hint = hints[hintsUsed % hints.length];
  return `💡 ${hint}`;
};

// Simple sync version for backward compatibility
export const getHintSync = (
  scenario: RoleplayScenario,
  hintIndex: number
): string => {
  const hints = scenario.hints;
  const hint = hints[hintIndex % hints.length];
  return `💡 ${hint}`;
};

// ============================================
// EXAMPLE RESPONSES
// ============================================

export const getExampleResponses = (
  scenario: RoleplayScenario,
  turnContext: string
): string[] => {
  return scenario.goodResponses.slice(0, 3);
};

// ============================================
// STATUS CHECK
// ============================================

export const getServiceStatus = () => {
  return checkAPIStatus();
};
