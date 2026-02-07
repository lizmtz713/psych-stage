import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  BRAIN_CATEGORIES,
  BRAIN_CARDS,
  getCardsByCategory,
  BrainCard,
  BrainCategory,
} from '../../data/brain-health';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

export function LearnScreen({ navigation }: any) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const scrollX = useRef(new Animated.Value(0)).current;

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setExpandedCard(null);
  };

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
      setExpandedCard(null);
    } else {
      navigation.goBack();
    }
  };

  const currentCategory = selectedCategory
    ? BRAIN_CATEGORIES.find((c) => c.id === selectedCategory)
    : null;

  const currentCards = selectedCategory ? getCardsByCategory(selectedCategory) : [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={currentCategory ? [currentCategory.color, currentCategory.color + 'CC'] : ['#8B5CF6', '#A78BFA']}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentCategory ? currentCategory.name : 'learn'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSub}>
          {currentCategory
            ? currentCategory.description
            : 'understand your brain, change your life'}
        </Text>
      </LinearGradient>

      {!selectedCategory ? (
        // Category Grid
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>pick a topic</Text>
          <View style={styles.categoryGrid}>
            {BRAIN_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, { borderLeftColor: category.color }]}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryDesc}>{category.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Fact */}
          <View style={styles.quickFactSection}>
            <Text style={styles.sectionLabel}>💡 quick fact</Text>
            <QuickFactCard />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        // Card List for Category
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.cardCount}>
            {currentCards.length} cards
          </Text>
          
          {currentCards.map((card) => (
            <BrainCardView
              key={card.id}
              card={card}
              expanded={expandedCard === card.id}
              onPress={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
              accentColor={currentCategory?.color || '#8B5CF6'}
            />
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

// Individual card component
function BrainCardView({
  card,
  expanded,
  onPress,
  accentColor,
}: {
  card: BrainCard;
  expanded: boolean;
  onPress: () => void;
  accentColor: string;
}) {
  return (
    <TouchableOpacity
      style={styles.brainCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{card.emoji}</Text>
        <View style={styles.cardTitleArea}>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.cardQuickTake}>{card.quickTake}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#9CA3AF"
        />
      </View>

      {expanded && (
        <View style={styles.cardExpanded}>
          <Text style={styles.cardContent}>{card.content}</Text>

          {card.funFact && (
            <View style={[styles.funFactBox, { backgroundColor: accentColor + '15' }]}>
              <Text style={[styles.funFactLabel, { color: accentColor }]}>
                🤯 did you know?
              </Text>
              <Text style={styles.funFactText}>{card.funFact}</Text>
            </View>
          )}

          {card.tryThis && (
            <View style={styles.tryThisBox}>
              <Text style={styles.tryThisLabel}>⚡ try this</Text>
              <Text style={styles.tryThisText}>{card.tryThis}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// Random fact card for main screen
function QuickFactCard() {
  const [card] = useState(() => {
    const allWithFacts = BRAIN_CARDS.filter((c) => c.funFact);
    return allWithFacts[Math.floor(Math.random() * allWithFacts.length)];
  });

  if (!card) return null;

  return (
    <View style={styles.quickFactCard}>
      <Text style={styles.quickFactEmoji}>{card.emoji}</Text>
      <Text style={styles.quickFactTitle}>{card.title}</Text>
      <Text style={styles.quickFactText}>{card.funFact}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 8,
  },
  
  // Category Grid
  categoryGrid: {
    gap: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  categoryDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  
  // Cards in category
  cardCount: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  brainCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  cardTitleArea: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardQuickTake: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  cardExpanded: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cardContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  funFactBox: {
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  funFactLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  funFactText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  tryThisBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  tryThisLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  tryThisText: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
  
  // Quick Fact
  quickFactSection: {
    marginTop: 24,
  },
  quickFactCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickFactEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  quickFactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  quickFactText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
  },
});
