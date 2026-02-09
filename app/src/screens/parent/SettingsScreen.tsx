import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, 
  Modal, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import ContentPermissionsService, {
  ContentCategory,
  PermissionLevel,
  Region,
  ContentPermissions,
} from '../../services/ContentPermissionsService';

// ============================================
// TYPES
// ============================================

interface CategorySetting {
  category: ContentCategory;
  name: string;
  emoji: string;
  description: string;
  level: PermissionLevel;
  canOverride: boolean;
  minAgeForFull: number;
  reason: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SettingsScreen() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [alertsOnly, setAlertsOnly] = useState(false);
  
  // Content permissions state
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [categories, setCategories] = useState<CategorySetting[]>([]);
  const [overrides, setOverrides] = useState<Partial<ContentPermissions>>({});
  const [loading, setLoading] = useState(false);
  const [teenAge] = useState(15); // TODO: Get from family data
  const [region] = useState<Region>('US'); // TODO: Get from user location

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    const config = await ContentPermissionsService.getPermissionConfig();
    if (config?.parentOverrides) {
      setOverrides(config.parentOverrides);
    }
    
    const allCategories = ContentPermissionsService.getAllCategoryPermissions(
      teenAge,
      region,
      config?.parentOverrides
    );
    
    setCategories(allCategories.map(c => ({
      category: c.category,
      name: c.name,
      emoji: c.emoji,
      description: c.description,
      level: c.level,
      canOverride: c.explanation.canParentOverride,
      minAgeForFull: c.explanation.minAgeForFull,
      reason: c.explanation.reason,
    })));
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleShareInvite = () => {
    Alert.alert(
      'Your Family Code',
      `Share this code with your teen so they can join your family in the app:\n\n${user?.familyId?.slice(-6).toUpperCase() || 'ABC123'}\n\nThey'll enter this when they sign up.`,
      [{ text: 'Got it' }]
    );
  };

  const handlePermissionChange = (category: ContentCategory, increase: boolean) => {
    const cat = categories.find(c => c.category === category);
    if (!cat) return;

    const levels: PermissionLevel[] = ['blocked', 'basic', 'age-appropriate', 'full'];
    const currentIndex = levels.indexOf(cat.level);
    const newIndex = increase 
      ? Math.min(currentIndex + 1, levels.length - 1)
      : Math.max(currentIndex - 1, 0);
    
    const newLevel = levels[newIndex];
    
    // Check if this is trying to go below minimum
    const defaults = ContentPermissionsService.getDefaultPermissions(teenAge, region);
    const defaultLevel = defaults[category];
    const defaultIndex = levels.indexOf(defaultLevel);
    
    if (newIndex < defaultIndex && !cat.canOverride) {
      Alert.alert(
        'Cannot Change',
        `Based on developmental research, this content level is the minimum recommended for age ${teenAge}.`,
        [{ text: 'Got it' }]
      );
      return;
    }

    // Update local state
    setOverrides(prev => ({ ...prev, [category]: newLevel }));
    setCategories(prev => prev.map(c => 
      c.category === category ? { ...c, level: newLevel } : c
    ));
  };

  const savePermissions = async () => {
    setLoading(true);
    try {
      await ContentPermissionsService.saveParentPermissions(teenAge, region, overrides);
      Alert.alert('Saved', 'Content permissions have been updated.');
      setShowPermissionsModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: PermissionLevel): string => {
    switch (level) {
      case 'blocked': return '#EF4444';
      case 'basic': return '#F59E0B';
      case 'age-appropriate': return '#10B981';
      case 'full': return '#6366F1';
    }
  };

  const getLevelLabel = (level: PermissionLevel): string => {
    switch (level) {
      case 'blocked': return 'Blocked';
      case 'basic': return 'Basic';
      case 'age-appropriate': return 'Standard';
      case 'full': return 'Full';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="person-outline" size={22} color="#6366F1" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>{user?.name}</Text>
                <Text style={styles.rowValue}>{user?.email}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Family */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={handleShareInvite}>
              <Ionicons name="people-outline" size={22} color="#6366F1" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Invite Teen</Text>
                <Text style={styles.rowValue}>Share your family code</Text>
              </View>
              <Ionicons name="share-outline" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Permissions - NEW */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Permissions</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.row} 
              onPress={() => setShowPermissionsModal(true)}
            >
              <Ionicons name="shield-checkmark-outline" size={22} color="#6366F1" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Sensitive Topics</Text>
                <Text style={styles.rowValue}>
                  Control access to sex, drugs, abuse topics
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <View style={styles.row}>
              <Ionicons name="location-outline" size={22} color="#6366F1" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Region</Text>
                <Text style={styles.rowValue}>{region} (affects legal defaults)</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.row}>
              <Ionicons name="calendar-outline" size={22} color="#6366F1" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Teen's Age</Text>
                <Text style={styles.rowValue}>{teenAge} years old</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.sectionNote}>
            Defaults are based on developmental psychology research and local laws. 
            You can adjust within safe bounds.
          </Text>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="notifications-outline" size={22} color="#6366F1" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
                thumbColor={notifications ? '#6366F1' : '#9CA3AF'}
              />
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.row}>
              <Ionicons name="mail-outline" size={22} color="#6366F1" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Daily Digest</Text>
                <Text style={styles.rowValue}>Summary at 8pm</Text>
              </View>
              <Switch
                value={dailyDigest}
                onValueChange={setDailyDigest}
                trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
                thumbColor={dailyDigest ? '#6366F1' : '#9CA3AF'}
              />
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.row}>
              <Ionicons name="warning-outline" size={22} color="#6366F1" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Alerts Only</Text>
                <Text style={styles.rowValue}>Only notify for yellow/red</Text>
              </View>
              <Switch
                value={alertsOnly}
                onValueChange={setAlertsOnly}
                trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
                thumbColor={alertsOnly ? '#6366F1' : '#9CA3AF'}
              />
            </View>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row}>
              <Ionicons name="help-circle-outline" size={22} color="#6366F1" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Help Center</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.row}>
              <Ionicons name="chatbubble-outline" size={22} color="#6366F1" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Contact Us</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.row}>
              <Ionicons name="document-text-outline" size={22} color="#6366F1" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>VIBE v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Content Permissions Modal */}
      <Modal
        visible={showPermissionsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPermissionsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPermissionsModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Content Permissions</Text>
            <TouchableOpacity onPress={savePermissions} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalInfo}>
              <Ionicons name="information-circle" size={20} color="#6366F1" />
              <Text style={styles.modalInfoText}>
                Defaults are based on developmental psychology research (AAP, APA) 
                and your region's laws. You can grant more access, but not less than 
                the science-based minimum for your teen's age.
              </Text>
            </View>

            {categories.map((cat) => (
              <View key={cat.category} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <Text style={styles.categoryDesc}>{cat.description}</Text>
                  </View>
                </View>

                <View style={styles.levelSelector}>
                  <TouchableOpacity
                    style={styles.levelButton}
                    onPress={() => handlePermissionChange(cat.category, false)}
                  >
                    <Ionicons name="remove-circle-outline" size={28} color="#6B7280" />
                  </TouchableOpacity>

                  <View style={[
                    styles.levelBadge, 
                    { backgroundColor: getLevelColor(cat.level) + '20' }
                  ]}>
                    <Text style={[
                      styles.levelText, 
                      { color: getLevelColor(cat.level) }
                    ]}>
                      {getLevelLabel(cat.level)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.levelButton}
                    onPress={() => handlePermissionChange(cat.category, true)}
                  >
                    <Ionicons name="add-circle-outline" size={28} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.categoryReason}>{cat.reason}</Text>
              </View>
            ))}

            <View style={styles.modalFooter}>
              <Text style={styles.footerTitle}>Permission Levels Explained</Text>
              <View style={styles.levelExplain}>
                <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.levelExplainText}>
                  <Text style={{ fontWeight: '600' }}>Blocked:</Text> Content not accessible
                </Text>
              </View>
              <View style={styles.levelExplain}>
                <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.levelExplainText}>
                  <Text style={{ fontWeight: '600' }}>Basic:</Text> General info only, no detail
                </Text>
              </View>
              <View style={styles.levelExplain}>
                <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.levelExplainText}>
                  <Text style={{ fontWeight: '600' }}>Standard:</Text> Age-appropriate full content
                </Text>
              </View>
              <View style={styles.levelExplain}>
                <View style={[styles.dot, { backgroundColor: '#6366F1' }]} />
                <Text style={styles.levelExplainText}>
                  <Text style={{ fontWeight: '600' }}>Full:</Text> Complete access (older teens)
                </Text>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8, marginLeft: 4 },
  sectionNote: { fontSize: 12, color: '#9CA3AF', marginTop: 8, marginLeft: 4, lineHeight: 18 },
  card: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  rowInfo: { flex: 1, marginLeft: 12 },
  rowLabel: { fontSize: 16, color: '#1F2937' },
  rowValue: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 50 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEE2E2', padding: 16, borderRadius: 12,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444', marginLeft: 8 },
  version: { textAlign: 'center', color: '#9CA3AF', marginTop: 24, fontSize: 13 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  modalCancel: { fontSize: 16, color: '#6B7280' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1F2937' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#6366F1' },
  modalContent: { flex: 1, padding: 16 },
  modalInfo: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modalInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#4338CA',
    marginLeft: 12,
    lineHeight: 20,
  },

  // Category Card
  categoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryEmoji: { fontSize: 28 },
  categoryInfo: { marginLeft: 12, flex: 1 },
  categoryName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  categoryDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  levelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  levelButton: { padding: 8 },
  levelBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  levelText: { fontSize: 14, fontWeight: '600' },
  categoryReason: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Footer
  modalFooter: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  levelExplain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  levelExplainText: {
    fontSize: 13,
    color: '#4B5563',
  },
});
