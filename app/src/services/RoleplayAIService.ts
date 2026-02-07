// Roleplay AI Service
// Handles AI responses, safety detection, and feedback generation

import { RoleplayScenario } from '../data/roleplay-scenarios';

// ============================================
// TYPES
// ============================================

export interface AIResponse {
  content: string;
  shouldPause: boolean;
  shouldEnd: boolean;
  safetyTriggered: boolean;
  sentiment: 'positive' | 'neutral' | 'negative' | 'escalating';
}

export interface FeedbackResult {
  strengths: string[];
  growthAreas: string[];
  skillsUsed: string[];
  overallScore: number; // 1-5
  suggestion: string;
  specificFeedback: string[];
}

export interface ConversationContext {
  scenario: RoleplayScenario;
  messages: Array<{ role: 'user' | 'ai' | 'system'; content: string }>;
  turnCount: number;
  userAge: number;
  hintsUsed: number;
}

// ============================================
// SAFETY DETECTION
// ============================================

const CRISIS_KEYWORDS = [
  'kill myself',
  'want to die',
  'suicide',
  'end it all',
  'hurt myself',
  'not worth living',
  'better off dead',
  'no point in living',
  'can\'t go on',
  'want to disappear',
];

const SAFETY_RESPONSE = `Hey — I want to pause for a second. What you just said sounds really heavy, and I want to make sure you're okay.

If you're having thoughts of hurting yourself, please reach out:
• Call or text 988 (Suicide & Crisis Lifeline)
• Text HOME to 741741 (Crisis Text Line)

Are you safe right now? If this is about the roleplay, we can keep practicing. If it's about you, let's talk — or get you connected with someone who can really help. 💜`;

export const detectCrisis = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
};

export const checkSafetyTriggers = (
  message: string, 
  scenario: RoleplayScenario
): boolean => {
  const lowerMessage = message.toLowerCase();
  
  // Check scenario-specific triggers
  if (scenario.safetyTriggers.some(trigger => 
    lowerMessage.includes(trigger.toLowerCase())
  )) {
    return true;
  }
  
  // Check universal crisis keywords
  return detectCrisis(message);
};

// ============================================
// DIALOGUE TREES
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

// Generic dialogue progressions based on scenario type
const DIALOGUE_TREES: Record<string, DialogueTree> = {
  'peer-pressure': {
    initial: {
      responses: [
        "Come on, everyone's doing it. Don't be weird about it.",
        "It's not a big deal. Just try it once.",
        "I thought you were cool.",
      ],
    },
    afterFirstNo: {
      responses: [
        "Why are you being like this? I thought we were friends.",
        "No one's gonna find out. Stop being paranoid.",
        "You're making this awkward.",
      ],
      keywords: ['no', 'don\'t', 'not', 'pass'],
    },
    persistent: {
      responses: [
        "Whatever, more for us I guess.",
        "Fine, be that way.",
        "I didn't think you'd be such a buzzkill.",
      ],
    },
    respectful: {
      responses: [
        "Alright, I get it. Sorry for pushing.",
        "Respect for sticking to what you want.",
        "Fair enough. You do you.",
      ],
      keywords: ['respect', 'boundary', 'decision'],
      sentiment: 'positive',
    },
  },
  'asking-for-help': {
    initial: {
      responses: [
        "What do you mean? What's going on?",
        "I'm listening. Tell me more.",
        "Is everything okay? You seem serious.",
      ],
    },
    afterDisclosure: {
      responses: [
        "I had no idea. How long has this been going on?",
        "Thank you for telling me. That took courage.",
        "I'm glad you trust me with this.",
      ],
      sentiment: 'positive',
    },
    maybeDefensive: {
      responses: [
        "Why didn't you tell me sooner?",
        "Are you sure it's that serious?",
        "I don't really know how to help with this.",
      ],
      sentiment: 'negative',
    },
    supportive: {
      responses: [
        "What do you need from me right now?",
        "I'm here for you. We'll figure this out together.",
        "You're not alone in this.",
      ],
      sentiment: 'positive',
    },
  },
  'setting-boundary': {
    initial: {
      responses: [
        "What do you mean? I don't understand the problem.",
        "Are you serious right now?",
        "I didn't realize it bothered you.",
      ],
    },
    pushback: {
      responses: [
        "You're being too sensitive.",
        "It's not a big deal, why are you making it one?",
        "I've always done it this way.",
      ],
      keywords: ['sensitive', 'dramatic', 'overreacting'],
      sentiment: 'negative',
    },
    testing: {
      responses: [
        "But what if I really need to?",
        "Can't you just this once?",
        "What about special circumstances?",
      ],
    },
    accepting: {
      responses: [
        "Okay. I hear you. I'll try to do better.",
        "I didn't realize. I'm sorry.",
        "Fair enough. I can respect that.",
      ],
      sentiment: 'positive',
    },
  },
  'conflict-resolution': {
    initial: {
      responses: [
        "So you want to talk about it now?",
        "What's there to talk about?",
        "Fine. What's on your mind?",
      ],
    },
    defensive: {
      responses: [
        "You always do this. Make me the bad guy.",
        "What about what YOU did?",
        "I don't see why this is my fault.",
      ],
      sentiment: 'negative',
    },
    opening: {
      responses: [
        "I guess I can see your point...",
        "I didn't think about it that way.",
        "Help me understand where you're coming from.",
      ],
      sentiment: 'positive',
    },
    resolution: {
      responses: [
        "I'm sorry. I shouldn't have done that.",
        "Can we figure out how to move forward?",
        "I don't want to fight. I want to fix this.",
      ],
      sentiment: 'positive',
    },
  },
};

// ============================================
// RESPONSE GENERATION
// ============================================

export const generateAIResponse = async (
  userMessage: string,
  context: ConversationContext
): Promise<AIResponse> => {
  const { scenario, messages, turnCount } = context;
  
  // Check for safety triggers first
  if (checkSafetyTriggers(userMessage, scenario)) {
    return {
      content: SAFETY_RESPONSE,
      shouldPause: true,
      shouldEnd: false,
      safetyTriggered: true,
      sentiment: 'neutral',
    };
  }
  
  // Analyze user message
  const analysis = analyzeUserMessage(userMessage, scenario);
  
  // Get appropriate response based on turn and analysis
  const response = selectResponse(scenario, turnCount, analysis);
  
  // Determine if conversation should end
  const shouldEnd = turnCount >= 5 || analysis.isResolution;
  
  return {
    content: response,
    shouldPause: false,
    shouldEnd,
    safetyTriggered: false,
    sentiment: analysis.sentiment,
  };
};

interface MessageAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative' | 'escalating';
  isAssertive: boolean;
  isApologetic: boolean;
  isResolution: boolean;
  keywords: string[];
}

const analyzeUserMessage = (
  message: string, 
  scenario: RoleplayScenario
): MessageAnalysis => {
  const lowerMessage = message.toLowerCase();
  
  // Check for assertive language
  const assertivePatterns = [
    'i need', 'i want', 'i feel', 'no', 'i don\'t',
    'my boundary', 'not okay', 'respect', 'please stop'
  ];
  const isAssertive = assertivePatterns.some(p => lowerMessage.includes(p));
  
  // Check for apologetic language
  const apologeticPatterns = [
    'sorry', 'i guess', 'maybe i', 'never mind', 'it\'s fine',
    'i\'m just', 'it\'s okay'
  ];
  const isApologetic = apologeticPatterns.some(p => lowerMessage.includes(p));
  
  // Check for resolution language
  const resolutionPatterns = [
    'thank you', 'i appreciate', 'we can', 'let\'s', 'together',
    'understand', 'okay'
  ];
  const isResolution = resolutionPatterns.some(p => lowerMessage.includes(p));
  
  // Determine sentiment
  let sentiment: MessageAnalysis['sentiment'] = 'neutral';
  if (isAssertive && !isApologetic) sentiment = 'positive';
  if (isApologetic && !isAssertive) sentiment = 'negative';
  if (lowerMessage.includes('!') && message.length < 20) sentiment = 'escalating';
  
  return {
    sentiment,
    isAssertive,
    isApologetic,
    isResolution,
    keywords: extractKeywords(message),
  };
};

const extractKeywords = (message: string): string[] => {
  const words = message.toLowerCase().split(/\s+/);
  const stopWords = ['i', 'you', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of'];
  return words.filter(w => !stopWords.includes(w) && w.length > 2);
};

const selectResponse = (
  scenario: RoleplayScenario,
  turn: number,
  analysis: MessageAnalysis
): string => {
  // Use scenario-specific responses if available
  const treeType = getDialogueTreeType(scenario.category);
  const tree = DIALOGUE_TREES[treeType];
  
  if (!tree) {
    return getGenericResponse(turn, analysis, scenario);
  }
  
  // Select node based on turn and analysis
  let node: DialogueNode;
  
  if (turn === 0) {
    node = tree.initial;
  } else if (analysis.sentiment === 'positive' && tree.accepting) {
    node = tree.accepting;
  } else if (analysis.sentiment === 'negative' && tree.defensive) {
    node = tree.defensive;
  } else if (turn >= 3 && tree.resolution) {
    node = tree.resolution;
  } else {
    // Default progression
    const nodes = Object.values(tree);
    node = nodes[Math.min(turn, nodes.length - 1)];
  }
  
  // Select random response from node
  return node.responses[Math.floor(Math.random() * node.responses.length)];
};

const getDialogueTreeType = (category: string): string => {
  const mapping: Record<string, string> = {
    'substances': 'peer-pressure',
    'mental-health': 'asking-for-help',
    'boundaries': 'setting-boundary',
    'conflict': 'conflict-resolution',
    'friends': 'setting-boundary',
    'family': 'conflict-resolution',
    'romantic': 'setting-boundary',
    'school': 'asking-for-help',
    'work': 'setting-boundary',
  };
  return mapping[category] || 'conflict-resolution';
};

const getGenericResponse = (
  turn: number,
  analysis: MessageAnalysis,
  scenario: RoleplayScenario
): string => {
  // Use persona traits to generate contextual response
  const traits = scenario.personaTraits;
  
  const genericByTurn: string[][] = [
    // Turn 0-1: Initial reactions
    [
      "What do you mean by that?",
      "Can you explain more?",
      "I'm listening...",
    ],
    // Turn 2-3: Developing
    [
      "I hear what you're saying.",
      "That's a lot to take in.",
      "I didn't expect this conversation.",
    ],
    // Turn 4-5: Resolution
    [
      "I think I understand now.",
      "Thanks for talking to me about this.",
      "Let's figure this out together.",
    ],
  ];
  
  const stage = Math.min(Math.floor(turn / 2), 2);
  const responses = genericByTurn[stage];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

// ============================================
// FEEDBACK GENERATION
// ============================================

export const generateFeedback = (
  context: ConversationContext
): FeedbackResult => {
  const { scenario, messages, userAge } = context;
  const userMessages = messages.filter(m => m.role === 'user');
  
  // Analyze all user responses
  const analyses = userMessages.map(m => analyzeUserMessage(m.content, scenario));
  
  // Calculate metrics
  const assertiveCount = analyses.filter(a => a.isAssertive).length;
  const apologeticCount = analyses.filter(a => a.isApologetic).length;
  const totalTurns = userMessages.length;
  
  // Generate strengths
  const strengths: string[] = [];
  
  if (assertiveCount >= totalTurns / 2) {
    strengths.push("You were clear and direct about your needs");
  }
  if (analyses.some(a => a.keywords.includes('feel') || a.keywords.includes('i'))) {
    strengths.push("You used 'I' statements to express yourself");
  }
  if (userMessages.some(m => m.content.includes('?'))) {
    strengths.push("You asked questions to understand the other person");
  }
  if (!analyses.some(a => a.sentiment === 'escalating')) {
    strengths.push("You stayed calm throughout the conversation");
  }
  
  // Default strengths if none detected
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
  
  // Default growth area
  if (growthAreas.length === 0) {
    growthAreas.push("Keep practicing — confidence builds with repetition");
  }
  
  // Calculate score
  let score = 3; // Base score
  if (assertiveCount >= totalTurns / 2) score += 1;
  if (apologeticCount < totalTurns / 3) score += 0.5;
  if (strengths.length >= 3) score += 0.5;
  score = Math.min(5, Math.round(score));
  
  // Generate suggestion based on age
  const suggestion = generateAgeSensitiveSuggestion(userAge, analyses, scenario);
  
  return {
    strengths: strengths.slice(0, 3),
    growthAreas: growthAreas.slice(0, 2),
    skillsUsed: scenario.skillsTargeted.slice(0, 3),
    overallScore: score,
    suggestion,
    specificFeedback: generateSpecificFeedback(userMessages, scenario),
  };
};

const generateAgeSensitiveSuggestion = (
  age: number,
  analyses: MessageAnalysis[],
  scenario: RoleplayScenario
): string => {
  // Adapt suggestion to developmental stage
  if (age < 14) {
    // Concrete, simple
    return "Next time, try saying exactly what you need in one sentence. Like: 'I need you to stop doing that.'";
  } else if (age < 18) {
    // Still direct but more nuanced
    if (analyses.some(a => a.isApologetic)) {
      return "Try the 'broken record' technique — repeat your boundary calmly without adding new explanations or apologies.";
    }
    return "Practice the DEAR MAN skill: Describe, Express, Assert, Reinforce. It helps you ask for what you need clearly.";
  } else if (age < 25) {
    // More complex
    return "Notice the difference between explaining (one time) and over-explaining (multiple times). You only owe one explanation, if any.";
  } else {
    // Adult framing
    return "Consider what you were protecting by your responses. Sometimes we over-explain because we're managing their emotions, not advocating for ourselves.";
  }
};

const generateSpecificFeedback = (
  userMessages: Array<{ content: string }>,
  scenario: RoleplayScenario
): string[] => {
  const feedback: string[] = [];
  
  // Compare to good responses
  const goodPatterns = scenario.goodResponses.flatMap(r => 
    r.toLowerCase().split(' ').filter(w => w.length > 4)
  );
  
  userMessages.forEach((msg, i) => {
    const lowerMsg = msg.content.toLowerCase();
    
    // Check for common mistakes
    scenario.commonMistakes.forEach(mistake => {
      if (lowerMsg.includes(mistake.toLowerCase().split(' ')[0])) {
        feedback.push(`In response ${i + 1}: Watch out for "${mistake}"`);
      }
    });
    
    // Check for good elements
    goodPatterns.forEach(pattern => {
      if (lowerMsg.includes(pattern)) {
        feedback.push(`Good use of "${pattern}" in response ${i + 1}`);
      }
    });
  });
  
  return feedback.slice(0, 3);
};

// ============================================
// HINT SYSTEM
// ============================================

export const getHint = (
  scenario: RoleplayScenario,
  hintIndex: number
): string => {
  const hints = scenario.hints;
  const hint = hints[hintIndex % hints.length];
  return `💡 Hint: ${hint}`;
};

// ============================================
// EXAMPLE RESPONSES
// ============================================

export const getExampleResponses = (
  scenario: RoleplayScenario,
  turnContext: string
): string[] => {
  // Return good response examples relevant to the current turn
  return scenario.goodResponses.slice(0, 3);
};
