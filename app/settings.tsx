import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { getUserName, setUserName, getByokKey, setByokKey, getStreak, getSelectedPath, setSelectedPath } from '../lib/storage';
import { THEME } from '../constants/theme';

export default function Settings() {
  const [name, setName] = useState('');
  const [byokKey, setByokKeyState] = useState('');
  const [streak, setStreak] = useState(0);
  const [path, setPathState] = useState('none');
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const PATHS = [
    { id: 'think', label: '⊚  Think Clearly' },
    { id: 'self', label: '✦  Know Yourself' },
    { id: 'build', label: '◈  Build Something' },
  ];

  useEffect(() => {
    getUserName().then((n) => setName(n ?? ''));
    getByokKey().then((k) => setByokKeyState(k ?? ''));
    getStreak().then((s) => setStreak(s));
    getSelectedPath().then((p) => setPathState(p));
  }, []);

  async function handleSave() {
    await setUserName(name.trim());
    await setByokKey(byokKey.trim());
    await setSelectedPath(path);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleClearKey() {
    Alert.alert('Remove API key', 'This will switch back to the free 15 messages/day limit.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await setByokKey('');
          setByokKeyState('');
        }
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Streak — reframed */}
        {streak > 0 && (
          <View style={styles.streakCard}>
            <View style={styles.streakLeft}>
              <Text style={styles.streakCount}>{streak}</Text>
              <Text style={styles.streakUnit}>{streak === 1 ? 'day' : 'days'}</Text>
            </View>
            <View style={styles.streakRight}>
              <Text style={styles.streakTitle}>You have returned.</Text>
              <Text style={styles.streakSub}>
                {streak === 1
                  ? 'This is the beginning of something.'
                  : streak < 7
                  ? 'A habit is forming.'
                  : streak < 30
                  ? 'A week of honest thinking.'
                  : 'This is becoming who you are.'}
              </Text>
            </View>
          </View>
        )}

        {/* Path */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR PATH</Text>
          <View style={styles.pathRow}>
            {PATHS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.pathChip, path === p.id && styles.pathChipActive]}
                onPress={() => setPathState(p.id)}
              >
                <Text style={[styles.pathChipText, path === p.id && styles.pathChipTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notebook */}
        <TouchableOpacity style={styles.notebookBtn} onPress={() => router.push('/notebook')}>
          <View>
            <Text style={styles.notebookTitle}>◌ Notebook</Text>
            <Text style={styles.notebookSub}>Your saved reflections from Sol</Text>
          </View>
          <Text style={styles.notebookArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={THEME.textDim}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DEEPSEEK API KEY</Text>
          <Text style={styles.sectionDesc}>
            Add your own key to remove the 15 messages/day limit. Free to get at platform.deepseek.com
          </Text>
          <TextInput
            style={styles.input}
            value={byokKey}
            onChangeText={setByokKeyState}
            placeholder="sk-..."
            placeholderTextColor={THEME.textDim}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {byokKey ? (
            <TouchableOpacity onPress={handleClearKey} style={styles.clearBtn}>
              <Text style={styles.clearText}>Remove key</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{saved ? 'Saved ✓' : 'Save'}</Text>
        </TouchableOpacity>

        {/* About link */}
        <TouchableOpacity style={styles.aboutLink} onPress={() => router.push('/about')}>
          <Text style={styles.aboutLinkText}>About Sol & the Lycheetah Framework →</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderDim,
  },
  backBtn: { width: 60 },
  backText: { color: THEME.primary, fontSize: 15 },
  title: { fontSize: 17, color: THEME.text, fontWeight: '300', letterSpacing: 2 },
  content: { padding: 20, gap: 20 },

  streakCard: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakLeft: { alignItems: 'center', minWidth: 48 },
  streakCount: { fontSize: 36, color: THEME.primary, fontWeight: '200', lineHeight: 40 },
  streakUnit: { fontSize: 10, color: THEME.textDim, letterSpacing: 1 },
  streakRight: { flex: 1 },
  streakTitle: { fontSize: 15, color: THEME.text, fontWeight: '400', marginBottom: 3 },
  streakSub: { fontSize: 12, color: THEME.textMuted, lineHeight: 18 },

  notebookBtn: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notebookTitle: { fontSize: 15, color: THEME.text, fontWeight: '400', marginBottom: 3 },
  notebookSub: { fontSize: 12, color: THEME.textMuted },
  notebookArrow: { fontSize: 16, color: THEME.textDim },

  section: { gap: 8 },
  sectionTitle: { fontSize: 11, color: THEME.primary, letterSpacing: 2 },
  sectionDesc: { fontSize: 13, color: THEME.textMuted, lineHeight: 19 },
  input: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: THEME.text,
  },
  clearBtn: { alignSelf: 'flex-start' },
  clearText: { color: THEME.primary, fontSize: 13 },
  saveBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: THEME.background, fontSize: 16, fontWeight: '600', letterSpacing: 1 },

  pathRow: { gap: 8 },
  pathChip: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pathChipActive: { borderColor: THEME.primary, backgroundColor: '#1A1100' },
  pathChipText: { fontSize: 14, color: THEME.textMuted },
  pathChipTextActive: { color: THEME.primary },

  aboutLink: { alignItems: 'center', paddingVertical: 8 },
  aboutLinkText: { color: THEME.textDim, fontSize: 13 },
});
