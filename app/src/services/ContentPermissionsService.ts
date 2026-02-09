// Content Permissions Service
// Age-appropriate content gating based on developmental science and local laws
// Parents can customize within legal bounds

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES
// ============================================

export type ContentCategory = 
  | 'substances'      // Drugs, alcohol, vaping, addiction
  | 'sexuality'       // Relationships, consent, identity, health
  | 'self-harm'       // Self-injury, suicidal ideation
  | 'abuse'           // Physical, emotional, sexual abuse, neglect
  | 'violence'        // Bullying, fighting, domestic violence
  | 'mental-health'   // Depression, anxiety, disorders
  | 'eating'          // Eating disorders, body image
  | 'grief'           // Death, loss, trauma
  | 'identity'        // LGBTQ+, gender, cultural identity
  | 'relationships';  // Boundaries, conflict, peer pressure

export type PermissionLevel = 
  | 'blocked'         // Not accessible at all
  | 'basic'           // General info only, no detail
  | 'age-appropriate' // Full content adjusted for age
  | 'full';           // Complete access (older teens, parent approved)

export type Region = 
  | 'US' | 'US-CA' | 'US-TX' | 'US-NY' | 'US-FL'  // US states with specific laws
  | 'UK' | 'EU' | 'CA' | 'AU' | 'OTHER';

export interface ContentPermissions {
  [category: string]: PermissionLevel;
}

export interface PermissionConfig {
  teenAge: number;
  region: Region;
  parentOverrides: Partial<ContentPermissions>;
  parentConsented: boolean;
  consentDate?: string;
  lastUpdated: string;
}

// ============================================
// SCIENCE-BASED AGE RECOMMENDATIONS
// Based on AAP, APA, and developmental psychology research
// ============================================

// When topics become developmentally appropriate to discuss
const TOPIC_READINESS_AGES: Record<ContentCategory, {
  minAge: number;       // Minimum age for basic info
  fullAge: number;      // Age for full/detailed content
  notes: string;
}> = {
  'substances': {
    minAge: 10,  // DARE-style prevention starts
    fullAge: 14, // Realistic harm reduction info
    notes: 'Research shows harm reduction > abstinence-only. Earlier = better outcomes.',
  },
  'sexuality': {
    minAge: 10,  // Puberty education
    fullAge: 14, // Comprehensive sex ed
    notes: 'AAP recommends age-appropriate sex ed starting early. Consent concepts can start at 8+.',
  },
  'self-harm': {
    minAge: 12,  // When self-harm often begins
    fullAge: 13, // Full support resources
    notes: 'Talking about it does NOT increase risk. Silence increases risk.',
  },
  'abuse': {
    minAge: 6,   // Body safety, good touch/bad touch
    fullAge: 12, // Understanding abuse dynamics
    notes: 'Early education is protective. Kids need vocabulary to disclose.',
  },
  'violence': {
    minAge: 8,   // Bullying awareness
    fullAge: 12, // Complex violence topics
    notes: 'Bullying peaks in middle school. Early intervention matters.',
  },
  'mental-health': {
    minAge: 8,   // Emotions vocabulary
    fullAge: 12, // Understanding disorders
    notes: 'Mental health literacy reduces stigma and increases help-seeking.',
  },
  'eating': {
    minAge: 10,  // Body image awareness
    fullAge: 13, // Eating disorder info
    notes: 'Eating disorders often start in early adolescence. Early detection key.',
  },
  'grief': {
    minAge: 6,   // All ages experience grief
    fullAge: 10, // Complex grief processing
    notes: 'Children can process grief at any age with appropriate support.',
  },
  'identity': {
    minAge: 8,   // Understanding diversity
    fullAge: 12, // Personal identity exploration
    notes: 'LGBTQ+ youth benefit from affirming info regardless of age.',
  },
  'relationships': {
    minAge: 8,   // Friendship skills
    fullAge: 12, // Romantic relationships, boundaries
    notes: 'Social skills are foundational. Boundary-setting is age-agnostic.',
  },
};

// ============================================
// REGIONAL LEGAL REQUIREMENTS
// ============================================

interface RegionalRules {
  parentalConsentRequired: boolean;
  minAgeForSensitiveContent: number;
  restrictedCategories: ContentCategory[];
  notes: string;
}

const REGIONAL_RULES: Record<Region, RegionalRules> = {
  'US': {
    parentalConsentRequired: true,  // COPPA under 13
    minAgeForSensitiveContent: 13,
    restrictedCategories: [],
    notes: 'COPPA requires parental consent for data collection under 13. No content restrictions.',
  },
  'US-CA': {
    parentalConsentRequired: true,
    minAgeForSensitiveContent: 13,
    restrictedCategories: [],
    notes: 'California Age-Appropriate Design Code adds data protections.',
  },
  'US-TX': {
    parentalConsentRequired: true,
    minAgeForSensitiveContent: 13,
    restrictedCategories: [],
    notes: 'Texas HB 18 requires age verification for some content.',
  },
  'US-NY': {
    parentalConsentRequired: true,
    minAgeForSensitiveContent: 13,
    restrictedCategories: [],
    notes: 'Standard US rules apply.',
  },
  'US-FL': {
    parentalConsentRequired: true,
    minAgeForSensitiveContent: 13,
    restrictedCategories: [],
    notes: 'Florida HB 3 adds social media restrictions for under 14.',
  },
  'UK': {
    parentalConsentRequired: true,  // UK Age Appropriate Design Code
    minAgeForSensitiveContent: 13,
    restrictedCategories: [],
    notes: 'UK AADC requires high privacy defaults for under 18.',
  },
  'EU': {
    parentalConsentRequired: true,  // GDPR-K
    minAgeForSensitiveContent: 13,  // Varies by country (13-16)
    restrictedCategories: [],
    notes: 'GDPR sets 16 as default, but countries can lower to 13.',
  },
  'CA': {
    parentalConsentRequired: true,
    minAgeForSensitiveContent: 13,
    restrictedCategories: [],
    notes: 'PIPEDA + provincial laws. Similar to US COPPA.',
  },
  'AU': {
    parentalConsentRequired: true,
    minAgeForSensitiveContent: 13,
    restrictedCategories: [],
    notes: 'Privacy Act 1988 + Online Safety Act protections.',
  },
  'OTHER': {
    parentalConsentRequired: true,
    minAgeForSensitiveContent: 13,
    restrictedCategories: [],
    notes: 'Default conservative rules applied.',
  },
};

// ============================================
// CORE LOGIC
// ============================================

const STORAGE_KEY = '@vibe_content_permissions';

/**
 * Get default permissions based on age and region
 */
export const getDefaultPermissions = (
  age: number,
  region: Region
): ContentPermissions => {
  const permissions: ContentPermissions = {};
  const regionalRules = REGIONAL_RULES[region];

  for (const [category, readiness] of Object.entries(TOPIC_READINESS_AGES)) {
    const cat = category as ContentCategory;
    
    // Check if blocked by regional law
    if (regionalRules.restrictedCategories.includes(cat)) {
      permissions[cat] = 'blocked';
      continue;
    }

    // Determine level based on age
    if (age < readiness.minAge) {
      permissions[cat] = 'blocked';
    } else if (age < readiness.fullAge) {
      permissions[cat] = 'basic';
    } else if (age < 16) {
      permissions[cat] = 'age-appropriate';
    } else {
      permissions[cat] = 'full';
    }
  }

  return permissions;
};

/**
 * Get effective permissions (defaults + parent overrides)
 */
export const getEffectivePermissions = async (
  teenAge: number,
  region: Region
): Promise<ContentPermissions> => {
  const defaults = getDefaultPermissions(teenAge, region);
  
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const config: PermissionConfig = JSON.parse(stored);
      
      // Validate consent is still valid
      if (config.parentConsented) {
        // Merge parent overrides with defaults
        return {
          ...defaults,
          ...config.parentOverrides,
        };
      }
    }
  } catch (error) {
    console.error('Error loading permissions:', error);
  }

  return defaults;
};

/**
 * Check if specific content is accessible
 */
export const canAccessContent = async (
  category: ContentCategory,
  contentLevel: PermissionLevel,
  teenAge: number,
  region: Region
): Promise<{ allowed: boolean; reason?: string }> => {
  const permissions = await getEffectivePermissions(teenAge, region);
  const currentLevel = permissions[category] || 'blocked';

  const levelOrder: PermissionLevel[] = ['blocked', 'basic', 'age-appropriate', 'full'];
  const currentIndex = levelOrder.indexOf(currentLevel);
  const requiredIndex = levelOrder.indexOf(contentLevel);

  if (currentIndex >= requiredIndex) {
    return { allowed: true };
  }

  // Determine reason
  const readiness = TOPIC_READINESS_AGES[category];
  if (teenAge < readiness.minAge) {
    return {
      allowed: false,
      reason: `This content is available at age ${readiness.minAge}+`,
    };
  }

  return {
    allowed: false,
    reason: 'Parent approval needed for this content level',
  };
};

/**
 * Save parent permission overrides
 */
export const saveParentPermissions = async (
  teenAge: number,
  region: Region,
  overrides: Partial<ContentPermissions>
): Promise<void> => {
  const config: PermissionConfig = {
    teenAge,
    region,
    parentOverrides: overrides,
    parentConsented: true,
    consentDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

/**
 * Get current permission config
 */
export const getPermissionConfig = async (): Promise<PermissionConfig | null> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading permission config:', error);
  }
  return null;
};

/**
 * Check if parental consent is required
 */
export const requiresParentalConsent = (age: number, region: Region): boolean => {
  const rules = REGIONAL_RULES[region];
  return age < rules.minAgeForSensitiveContent || rules.parentalConsentRequired;
};

/**
 * Get human-readable explanation for a category's restrictions
 */
export const getRestrictionExplanation = (
  category: ContentCategory,
  teenAge: number,
  region: Region
): { 
  currentLevel: PermissionLevel;
  reason: string;
  canParentOverride: boolean;
  minAgeForFull: number;
} => {
  const defaults = getDefaultPermissions(teenAge, region);
  const readiness = TOPIC_READINESS_AGES[category];
  const rules = REGIONAL_RULES[region];

  let reason = '';
  let canOverride = true;

  if (rules.restrictedCategories.includes(category)) {
    reason = `Restricted in your region (${region})`;
    canOverride = false;
  } else if (teenAge < readiness.minAge) {
    reason = `Recommended for ages ${readiness.minAge}+. ${readiness.notes}`;
    canOverride = false; // Can't override science-based minimums
  } else if (teenAge < readiness.fullAge) {
    reason = `Full content recommended for ages ${readiness.fullAge}+. Basic info available now.`;
    canOverride = true;
  } else {
    reason = 'Full content available';
    canOverride = true;
  }

  return {
    currentLevel: defaults[category],
    reason,
    canParentOverride: canOverride,
    minAgeForFull: readiness.fullAge,
  };
};

/**
 * Get all categories with their current permissions and explanations
 */
export const getAllCategoryPermissions = (
  teenAge: number,
  region: Region,
  overrides?: Partial<ContentPermissions>
): Array<{
  category: ContentCategory;
  name: string;
  emoji: string;
  level: PermissionLevel;
  explanation: ReturnType<typeof getRestrictionExplanation>;
  description: string;
}> => {
  const defaults = getDefaultPermissions(teenAge, region);
  const effective = { ...defaults, ...overrides };

  const categoryMeta: Record<ContentCategory, { name: string; emoji: string; description: string }> = {
    'substances': {
      name: 'Substances & Addiction',
      emoji: '💊',
      description: 'Alcohol, drugs, vaping, and addiction support',
    },
    'sexuality': {
      name: 'Sexuality & Relationships',
      emoji: '❤️',
      description: 'Consent, identity, sexual health, relationships',
    },
    'self-harm': {
      name: 'Self-Harm & Crisis',
      emoji: '🩹',
      description: 'Self-injury, suicidal thoughts, crisis support',
    },
    'abuse': {
      name: 'Abuse & Safety',
      emoji: '🛡️',
      description: 'Physical, emotional, sexual abuse recognition',
    },
    'violence': {
      name: 'Violence & Bullying',
      emoji: '⚡',
      description: 'Bullying, fighting, domestic violence',
    },
    'mental-health': {
      name: 'Mental Health',
      emoji: '🧠',
      description: 'Depression, anxiety, disorders, getting help',
    },
    'eating': {
      name: 'Eating & Body Image',
      emoji: '🪞',
      description: 'Eating disorders, body image, diet culture',
    },
    'grief': {
      name: 'Grief & Loss',
      emoji: '💙',
      description: 'Death, loss, trauma processing',
    },
    'identity': {
      name: 'Identity & LGBTQ+',
      emoji: '🌈',
      description: 'Gender, sexual orientation, cultural identity',
    },
    'relationships': {
      name: 'Relationships & Boundaries',
      emoji: '🤝',
      description: 'Friendships, peer pressure, healthy boundaries',
    },
  };

  return Object.keys(TOPIC_READINESS_AGES).map(cat => {
    const category = cat as ContentCategory;
    const meta = categoryMeta[category];
    return {
      category,
      name: meta.name,
      emoji: meta.emoji,
      level: effective[category],
      explanation: getRestrictionExplanation(category, teenAge, region),
      description: meta.description,
    };
  });
};

// ============================================
// EXPORTS
// ============================================

export const ContentPermissionsService = {
  getDefaultPermissions,
  getEffectivePermissions,
  canAccessContent,
  saveParentPermissions,
  getPermissionConfig,
  requiresParentalConsent,
  getRestrictionExplanation,
  getAllCategoryPermissions,
  TOPIC_READINESS_AGES,
  REGIONAL_RULES,
};

export default ContentPermissionsService;
