import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export function SettingsScreen() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [alertsOnly, setAlertsOnly] = useState(false);

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8, marginLeft: 4 },
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
});
