// Accessibility Utilities
// Comprehensive accessibility support for VIBE app

import { Platform, AccessibilityInfo, Dimensions } from 'react-native';

// ============================================
// ACCESSIBILITY LABELS & HINTS
// ============================================

export const a11yLabels = {
  // Navigation
  backButton: 'Go back',
  closeButton: 'Close',
  menuButton: 'Open menu',
  
  // Roleplay
  scenarioCard: (title: string, difficulty: string) => 
    `${title} scenario. Difficulty: ${difficulty}. Double tap to start.`,
  difficultyBadge: (level: string) => `Difficulty level: ${level}`,
  hintButton: 'Get a hint for this conversation',
  sendMessageButton: 'Send your message',
  
  // Topics
  topicCard: (name: string) => `${name}. Double tap to expand.`,
  topicExpanded: (name: string) => `${name} expanded. Swipe to navigate sections.`,
  resourceCard: (name: string, type: string) => 
    `${name}. ${type === 'call' ? 'Phone' : type === 'text' ? 'Text' : 'Website'}. Double tap to open.`,
  
  // Crisis
  crisisButton: 'Emergency help. Call 988 suicide crisis line.',
  sosButton: 'SOS emergency button. Double tap to call 988.',
  
  // Progress
  progressStat: (label: string, value: number | string) => `${label}: ${value}`,
  achievement: (name: string, description: string) => `Achievement: ${name}. ${description}`,
  
  // Chat
  userMessage: (content: string) => `You said: ${content}`,
  aiMessage: (persona: string, content: string) => `${persona} says: ${content}`,
  systemMessage: (content: string) => `System message: ${content}`,
  
  // Feedback
  feedbackScore: (score: number) => `Score: ${score} out of 5`,
  strength: (text: string) => `Strength: ${text}`,
  growthArea: (text: string) => `Area to improve: ${text}`,
};

export const a11yHints = {
  // Cards
  expandableCard: 'Double tap to expand or collapse',
  clickableCard: 'Double tap to select',
  
  // Buttons
  actionButton: 'Double tap to activate',
  toggleButton: (isOn: boolean) => `Double tap to ${isOn ? 'turn off' : 'turn on'}`,
  
  // Input
  textInput: 'Double tap to edit. Use keyboard to type.',
  
  // Lists
  scrollableList: 'Swipe up or down to scroll',
  horizontalList: 'Swipe left or right to see more',
  
  // Links
  externalLink: 'Opens in external app',
  phoneLink: 'Opens phone dialer',
  textLink: 'Opens messaging app',
};

// ============================================
// ACCESSIBILITY ROLES
// ============================================

export const a11yRoles = {
  button: 'button' as const,
  link: 'link' as const,
  header: 'header' as const,
  image: 'image' as const,
  text: 'text' as const,
  adjustable: 'adjustable' as const,
  alert: 'alert' as const,
  checkbox: 'checkbox' as const,
  combobox: 'combobox' as const,
  imagebutton: 'imagebutton' as const,
  menu: 'menu' as const,
  menubar: 'menubar' as const,
  menuitem: 'menuitem' as const,
  none: 'none' as const,
  progressbar: 'progressbar' as const,
  radio: 'radio' as const,
  radiogroup: 'radiogroup' as const,
  scrollbar: 'scrollbar' as const,
  search: 'search' as const,
  spinbutton: 'spinbutton' as const,
  summary: 'summary' as const,
  switch: 'switch' as const,
  tab: 'tab' as const,
  tablist: 'tablist' as const,
  timer: 'timer' as const,
  toolbar: 'toolbar' as const,
};

// ============================================
// SCREEN READER UTILS
// ============================================

export const announceForAccessibility = (message: string): void => {
  AccessibilityInfo.announceForAccessibility(message);
};

export const isScreenReaderEnabled = async (): Promise<boolean> => {
  return AccessibilityInfo.isScreenReaderEnabled();
};

export const announceIfScreenReader = async (message: string): Promise<void> => {
  const isEnabled = await isScreenReaderEnabled();
  if (isEnabled) {
    announceForAccessibility(message);
  }
};

// ============================================
// FONT SCALING
// ============================================

export const fontScale = {
  small: 0.85,
  normal: 1,
  large: 1.15,
  extraLarge: 1.3,
};

export const scaledFontSize = (baseSize: number, scale: number = 1): number => {
  const { fontScale: systemScale } = Dimensions.get('window');
  return baseSize * scale * Math.min(systemScale, 1.5); // Cap at 1.5x to prevent overflow
};

// ============================================
// COLOR CONTRAST
// ============================================

// WCAG AA requires 4.5:1 for normal text, 3:1 for large text
// WCAG AAA requires 7:1 for normal text, 4.5:1 for large text

export const colors = {
  // High contrast text colors
  text: {
    primary: '#1F2937',      // Gray 800 - high contrast on white
    secondary: '#4B5563',    // Gray 600 - still meets AA
    disabled: '#9CA3AF',     // Gray 400 - only for disabled
    onDark: '#FFFFFF',       // White on dark backgrounds
    onPrimary: '#FFFFFF',    // White on primary color
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
  },
  
  // Interactive colors
  interactive: {
    primary: '#6366F1',      // Indigo 500 - passes AA on white
    primaryDark: '#4338CA',  // Indigo 700 - better contrast
    success: '#059669',      // Emerald 600 - passes AA
    warning: '#D97706',      // Amber 600 - passes AA
    error: '#DC2626',        // Red 600 - passes AA
    info: '#2563EB',         // Blue 600 - passes AA
  },
  
  // Focus indicators
  focus: {
    ring: '#6366F1',
    ringOffset: '#FFFFFF',
  },
};

// Get contrast ratio between two colors
export const getContrastRatio = (foreground: string, background: string): number => {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

export const meetsContrastRequirement = (
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
};

// ============================================
// TOUCH TARGET SIZES
// ============================================

// WCAG recommends minimum 44x44 points, iOS recommends 44x44, Android 48x48
export const touchTargets = {
  minimum: 44,
  recommended: 48,
  comfortable: 56,
};

export const ensureMinimumTouchTarget = (
  width: number, 
  height: number
): { width: number; height: number } => {
  return {
    width: Math.max(width, touchTargets.minimum),
    height: Math.max(height, touchTargets.minimum),
  };
};

// ============================================
// MOTION & ANIMATION
// ============================================

export const prefersReducedMotion = async (): Promise<boolean> => {
  return AccessibilityInfo.isReduceMotionEnabled();
};

export const getAnimationDuration = async (baseMs: number): Promise<number> => {
  const reducedMotion = await prefersReducedMotion();
  return reducedMotion ? 0 : baseMs;
};

// ============================================
// FOCUS MANAGEMENT
// ============================================

export const focusStyles = {
  // Default focus ring
  outline: {
    borderWidth: 2,
    borderColor: colors.focus.ring,
    borderRadius: 4,
  },
  
  // For dark backgrounds
  outlineLight: {
    borderWidth: 2,
    borderColor: colors.focus.ringOffset,
    borderRadius: 4,
  },
};

// ============================================
// ACCESSIBILITY PROPS HELPERS
// ============================================

interface A11yProps {
  accessible: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: object;
}

export const makeAccessible = (
  label: string,
  options?: {
    hint?: string;
    role?: string;
    selected?: boolean;
    disabled?: boolean;
    checked?: boolean;
    expanded?: boolean;
  }
): A11yProps => {
  const props: A11yProps = {
    accessible: true,
    accessibilityLabel: label,
  };
  
  if (options?.hint) {
    props.accessibilityHint = options.hint;
  }
  
  if (options?.role) {
    props.accessibilityRole = options.role;
  }
  
  const state: any = {};
  if (options?.selected !== undefined) state.selected = options.selected;
  if (options?.disabled !== undefined) state.disabled = options.disabled;
  if (options?.checked !== undefined) state.checked = options.checked;
  if (options?.expanded !== undefined) state.expanded = options.expanded;
  
  if (Object.keys(state).length > 0) {
    props.accessibilityState = state;
  }
  
  return props;
};

// ============================================
// AUDIT RESULTS & RECOMMENDATIONS
// ============================================

export const accessibilityAudit = {
  // Things that are good
  strengths: [
    'High contrast color palette meeting WCAG AA standards',
    'Semantic heading structure',
    'Touch targets meet minimum 44pt requirement',
    'Crisis resources prominently available',
    'Alternative text patterns defined',
  ],
  
  // Things to implement
  recommendations: [
    {
      priority: 'high',
      item: 'Add accessibilityLabel to all interactive elements',
      details: 'Every button, card, and interactive element needs a clear label',
    },
    {
      priority: 'high', 
      item: 'Add accessibilityHint for complex interactions',
      details: 'Hints like "Double tap to expand" help users understand actions',
    },
    {
      priority: 'high',
      item: 'Test with VoiceOver (iOS) and TalkBack (Android)',
      details: 'Real screen reader testing is essential',
    },
    {
      priority: 'medium',
      item: 'Announce screen changes',
      details: 'Use announceForAccessibility when navigating or loading content',
    },
    {
      priority: 'medium',
      item: 'Support reduced motion preferences',
      details: 'Disable or reduce animations when user prefers reduced motion',
    },
    {
      priority: 'medium',
      item: 'Add focus indicators for keyboard navigation',
      details: 'Clear visual focus states for accessibility',
    },
    {
      priority: 'low',
      item: 'Support dynamic type sizing',
      details: 'Respect system font size preferences',
    },
    {
      priority: 'low',
      item: 'Add skip links for screen readers',
      details: 'Allow users to skip to main content',
    },
  ],
  
  // Screen-specific notes
  screens: {
    SeriousTopicsScreen: {
      good: ['Crisis resources prominent', 'Expandable cards'],
      improve: ['Add labels to all topic cards', 'Announce tab changes'],
    },
    RoleplayScreen: {
      good: ['Clear message distinction'],
      improve: ['Label hint button', 'Announce AI responses', 'Add chat live region'],
    },
    SpecializedTracksScreen: {
      good: ['Clear track labels'],
      improve: ['Mark coming soon items as disabled', 'Add badge labels'],
    },
  },
};

// ============================================
// EXPORT
// ============================================

export default {
  labels: a11yLabels,
  hints: a11yHints,
  roles: a11yRoles,
  colors,
  touchTargets,
  focusStyles,
  announce: announceForAccessibility,
  announceIfScreenReader,
  isScreenReaderEnabled,
  makeAccessible,
  scaledFontSize,
  getContrastRatio,
  meetsContrastRequirement,
  prefersReducedMotion,
  getAnimationDuration,
  audit: accessibilityAudit,
};
