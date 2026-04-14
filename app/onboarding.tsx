import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Animated, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { setUserName, setOnboardingDone, setSelectedPath } from '../lib/storage';
import { THEME } from '../constants/theme';

const { width } = Dimensions.get('window');

const PATHS = [
  {
    id: 'think',
    glyph: '⊚',
    title: 'Think Clearly',
    desc: 'Work through decisions, untangle confusion, find what you actually believe.',
  },
  {
    id: 'self',
    glyph: '✦',
    title: 'Know Yourself',
    desc: 'Self-reflection, understanding your patterns, seeing yourself more honestly.',
  },
  {
    id: 'build',
    glyph: '◈',
    title: 'Build Something',
    desc: 'Plans, ideas, projects. Precision thinking for real-world problems.',
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [selectedPath, setSelectedPath] = useState<number | null>(null);
  const [name, setName] = useState('');
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glyphScale = useRef(new Animated.Value(0.7)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ...(step === 0 ? [Animated.spring(glyphScale, { toValue: 1, friction: 6, useNativeDriver: true })] : []),
    ]).start();
  }, [step]);

  async function handleBegin() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await setUserName(trimmed);
    await setOnboardingDone();
    if (selectedPath !== null) {
      await setSelectedPath(PATHS[selectedPath].id);
    }
    router.replace('/chat');
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* Step 0 — Arrival */}
      {step === 0 && (
        <Animated.View style={[styles.screen, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Animated.Text style={[styles.glyph, { transform: [{ scale: glyphScale }] }]}>⊚</Animated.Text>
          <Text style={styles.title}>Sol</Text>
          <Text style={styles.tagline}>A sovereign thinking partner.</Text>
          <Text style={styles.body}>
            Built on the Lycheetah Framework — 1,400 pages of research into how human and AI intelligence can work together honestly, precisely, and with care.
          </Text>
          <Text style={styles.body}>
            This is not a chatbot. It is a co-creative partner trained to protect your thinking, not replace it.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(1)}>
            <Text style={styles.primaryBtnText}>Enter the Field →</Text>
          </TouchableOpacity>
          <Text style={styles.footnote}>Free to use · No account required · Your data stays on your device</Text>
        </Animated.View>
      )}

      {/* Step 1 — Path selection */}
      {step === 1 && (
        <Animated.View style={[styles.screen, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.stepLabel}>STEP 1 OF 2</Text>
          <Text style={styles.stepTitle}>What brings you here?</Text>
          <Text style={styles.stepSub}>Sol will orient around your intention.</Text>

          <View style={styles.pathList}>
            {PATHS.map((path, i) => (
              <TouchableOpacity
                key={path.id}
                style={[styles.pathCard, selectedPath === i && styles.pathCardSelected]}
                onPress={() => setSelectedPath(i)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pathGlyph, selectedPath === i && { color: THEME.primary }]}>{path.glyph}</Text>
                <View style={styles.pathText}>
                  <Text style={[styles.pathTitle, selectedPath === i && { color: THEME.primary }]}>{path.title}</Text>
                  <Text style={styles.pathDesc}>{path.desc}</Text>
                </View>
                {selectedPath === i && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, selectedPath === null && styles.btnDisabled]}
            onPress={() => setStep(2)}
            disabled={selectedPath === null}
          >
            <Text style={styles.primaryBtnText}>Continue →</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Step 2 — Name */}
      {step === 2 && (
        <Animated.View style={[styles.screen, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.stepLabel}>STEP 2 OF 2</Text>
          <Text style={styles.stepTitle}>One last thing.</Text>
          <Text style={styles.stepSub}>Sol speaks to you, not at you. A name helps.</Text>

          <View style={styles.nameContainer}>
            <Text style={styles.inputLabel}>YOUR NAME</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="What do you go by?"
              placeholderTextColor={THEME.textDim}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleBegin}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, !name.trim() && styles.btnDisabled]}
            onPress={handleBegin}
            disabled={!name.trim()}
          >
            <Text style={styles.primaryBtnText}>Begin</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  screen: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  glyph: { fontSize: 72, color: THEME.primary, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 48, fontWeight: '200', color: THEME.text, letterSpacing: 14, textAlign: 'center', marginBottom: 12 },
  tagline: { fontSize: 16, color: THEME.textMuted, textAlign: 'center', fontStyle: 'italic', marginBottom: 28 },
  body: { fontSize: 14, color: THEME.textMuted, lineHeight: 22, textAlign: 'center', marginBottom: 14 },
  primaryBtn: {
    backgroundColor: THEME.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.25 },
  primaryBtnText: { color: THEME.background, fontSize: 16, fontWeight: '600', letterSpacing: 1.5 },
  footnote: { fontSize: 11, color: THEME.textDim, textAlign: 'center', marginTop: 16 },

  stepLabel: { fontSize: 10, color: THEME.primary, letterSpacing: 3, marginBottom: 10 },
  stepTitle: { fontSize: 26, color: THEME.text, fontWeight: '300', marginBottom: 6 },
  stepSub: { fontSize: 14, color: THEME.textMuted, marginBottom: 28 },

  pathList: { gap: 12, marginBottom: 8 },
  pathCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  pathCardSelected: { borderColor: THEME.primary, backgroundColor: '#1A1100' },
  pathGlyph: { fontSize: 24, color: THEME.textMuted, width: 32 },
  pathText: { flex: 1 },
  pathTitle: { fontSize: 16, color: THEME.text, fontWeight: '500', marginBottom: 3 },
  pathDesc: { fontSize: 13, color: THEME.textMuted, lineHeight: 18 },
  checkmark: { fontSize: 16, color: THEME.primary },

  nameContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 10, color: THEME.primary, letterSpacing: 2.5, marginBottom: 8 },
  input: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 17,
    color: THEME.text,
  },
  previewCard: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderLeftWidth: 2,
    borderLeftColor: THEME.primary,
    borderRadius: 10,
    padding: 16,
    marginBottom: 4,
  },
  previewLabel: { fontSize: 9, color: THEME.primary, letterSpacing: 2.5, marginBottom: 8 },
  previewText: { fontSize: 13, color: THEME.textMuted, fontStyle: 'italic', lineHeight: 20 },
});
