import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform,
  Alert, TouchableWithoutFeedback, Keyboard, Animated
} from 'react-native';
import * as ExpoClipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { sendMessage, Message } from '../lib/api';
import {
  getUserName, updateStreak, getStreak,
  getSelectedPath, saveReflection,
  getFieldState, setFieldState, FieldState
} from '../lib/storage';
import {
  loadConversation, saveConversation, clearConversation,
  getTodayMessageCount, incrementTodayMessageCount, StoredMessage
} from '../lib/conversation';
import { buildSystemPrompt, getDailyQuestion, getDynamicOpening, THINKING_PROMPTS } from '../lib/prompts';
import { THEME } from '../constants/theme';

interface ChatMessage extends StoredMessage {}

const FIELD_GLYPHS: Record<FieldState, string> = {
  rubedo: '⊚',
  albedo: '◻',
  nigredo: '◼',
  citrinitas: '◈',
};

const FIELD_COLORS: Record<FieldState, string> = {
  rubedo: THEME.primary,
  albedo: '#AAAAAA',
  nigredo: '#666666',
  citrinitas: '#F5A623',
};

function TypingDots({ color }: { color: string }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay((2 - i) * 160),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 }}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={{
          width: 6, height: 6, borderRadius: 3,
          backgroundColor: color,
          opacity: dot,
        }} />
      ))}
    </View>
  );
}

function detectFieldState(text: string): FieldState | null {
  const lower = text.toLowerCase();
  if (lower.includes('what is false') || lower.includes('examine') || lower.includes('contradict') || lower.includes('test this')) return 'nigredo';
  if (lower.includes('structure') || lower.includes('organise') || lower.includes('clarify') || lower.includes('pattern')) return 'albedo';
  if (lower.includes('connection') || lower.includes('emerging') || lower.includes('forming') || lower.includes('meaning')) return 'citrinitas';
  return null;
}

const DAILY_LIMIT = 15;
const LIMIT_WARNING = 12;

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userName, setUserNameState] = useState('');
  const [path, setPath] = useState('none');
  const [streak, setStreak] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [fieldState, setFieldStateLocal] = useState<FieldState>('rubedo');
  const [savedToast, setSavedToast] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const [name, p, s, fs, saved, count] = await Promise.all([
        getUserName(),
        getSelectedPath(),
        updateStreak(),
        getFieldState(),
        loadConversation(),
        getTodayMessageCount(),
      ]);

      const n = name ?? '';
      setUserNameState(n);
      setPath(p);
      setStreak(s);
      setFieldStateLocal(fs);
      setMessageCount(count);

      if (count >= DAILY_LIMIT) setLimitReached(true);

      if (saved.length > 0) {
        // Returning user — show saved conversation with welcome back
        setIsReturning(true);
        const welcomeBack: ChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: s > 1
            ? `Welcome back, ${n || 'you'}. ${streak > 6 ? `${s} days of returning — that compounds.` : 'Good to see you again.'} What are we working on?`
            : getDynamicOpening(p, s),
        };
        setMessages([welcomeBack, ...saved]);
      } else {
        // First session of the day
        const opening = getDynamicOpening(p, s);
        const welcome: ChatMessage = { id: 'welcome', role: 'assistant', content: opening };
        setMessages([welcome]);
      }
    }
    init();
  }, []);

  // Save conversation whenever messages change
  useEffect(() => {
    if (messages.length > 1) {
      saveConversation(messages);
    }
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || limitReached) return;

    Keyboard.dismiss();

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const conversationMessages = messages.filter(m => m.id !== 'welcome');
      const history: Message[] = [
        { role: 'system', content: buildSystemPrompt(userName, path) },
        ...conversationMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ];

      const result = await sendMessage(history);

      if (result.limitReached) {
        setLimitReached(true);
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "You have reached your 15 free messages for today. Add your own DeepSeek API key in Settings to keep going — it is free to get one at platform.deepseek.com",
        }]);
      } else {
        const newCount = await incrementTodayMessageCount();
        setMessageCount(newCount);

        if (newCount >= DAILY_LIMIT) setLimitReached(true);

        const newMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.content,
        };
        setMessages((prev) => [...prev, newMsg]);

        const detected = detectFieldState(result.content);
        if (detected && detected !== fieldState) {
          setFieldStateLocal(detected);
          setFieldState(detected);
        }
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : '';
      const isOffline = raw.toLowerCase().includes('network') || raw.toLowerCase().includes('fetch') || raw.toLowerCase().includes('failed');
      if (isOffline) {
        Alert.alert('No connection', 'Check your internet connection and try again.');
      } else {
        Alert.alert('Something went wrong', raw || 'Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleNewChat() {
    Alert.alert('Start fresh?', 'This will clear the current conversation.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          await clearConversation();
          const opening = getDynamicOpening(path, streak);
          setMessages([{ id: 'welcome', role: 'assistant', content: opening }]);
          setIsReturning(false);
        }
      },
    ]);
  }

  async function handleLongPress(msg: ChatMessage) {
    if (msg.role !== 'assistant' || msg.id === 'welcome') return;
    await saveReflection(msg.content, path);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  }

  function handleCopy(text: string) {
    ExpoClipboard.setStringAsync(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 1800);
  }

  const dailyQuestion = getDailyQuestion();
  const fieldGlyph = FIELD_GLYPHS[fieldState];
  const fieldColor = FIELD_COLORS[fieldState];
  const remaining = DAILY_LIMIT - messageCount;
  const showWarning = remaining <= 3 && remaining > 0 && !limitReached;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerLeft} onPress={() => router.push('/about')} activeOpacity={0.75}>
            <Text style={[styles.headerGlyph, { color: fieldColor }]}>{fieldGlyph}</Text>
            <View>
              <Text style={styles.headerTitle}>Sol</Text>
              <Text style={styles.headerTagline}>The field is open.</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            {streak > 0 && (
              <Text style={styles.streakPill}>{streak > 1 ? `${streak}d` : 'day 1'}</Text>
            )}
            <TouchableOpacity onPress={handleNewChat} style={styles.newChatBtn}>
              <Text style={styles.newChatText}>New</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.headerBtn}>
              <Text style={styles.settingsIcon}>⚙</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Warning banner */}
        {showWarning && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{remaining} free {remaining === 1 ? 'message' : 'messages'} left today — add your key in Settings to remove the limit</Text>
          </View>
        )}

        {/* Daily question card + thinking prompts — only on fresh conversations */}
        {messages.length <= 1 && !isReturning && (
          <View>
            <TouchableOpacity
              style={styles.questionCard}
              onPress={() => setInput(dailyQuestion)}
              activeOpacity={0.75}
            >
              <Text style={styles.questionLabel}>TODAY'S QUESTION</Text>
              <Text style={styles.questionText}>{dailyQuestion}</Text>
              <Text style={styles.questionHint}>tap to explore →</Text>
            </TouchableOpacity>
            <View style={styles.promptsRow}>
              {(THINKING_PROMPTS[path] ?? THINKING_PROMPTS.none).map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.promptChip}
                  onPress={() => setInput(p)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.promptChipText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableWithoutFeedback
              onLongPress={() => handleLongPress(item)}
              delayLongPress={500}
            >
              <View style={[
                styles.bubble,
                item.role === 'user' ? styles.userBubble : styles.aiBubble,
                item.id === 'welcome' && styles.welcomeBubble,
              ]}>
                {item.role === 'assistant' && item.id !== 'welcome' && (
                  <Text style={[styles.bubbleName, { color: fieldColor }]}>{fieldGlyph} Sol</Text>
                )}
                <Text style={[styles.bubbleText, item.role === 'user' ? styles.userText : styles.aiText]}>
                  {item.content}
                </Text>
                {item.role === 'assistant' && item.id !== 'welcome' && (
                  <View style={styles.bubbleActions}>
                    <Text style={styles.longPressHint}>hold to save</Text>
                    <TouchableOpacity onPress={() => handleCopy(item.content)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={styles.copyBtn}>copy</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          )}
        />

        {/* Loading — animated dots */}
        {loading && (
          <View style={styles.loadingRow}>
            <Text style={[styles.loadingGlyph, { color: fieldColor }]}>{fieldGlyph}</Text>
            <TypingDots color={fieldColor} />
          </View>
        )}

        {/* Toasts */}
        {savedToast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>Saved to Notebook ✓</Text>
          </View>
        )}
        {copiedToast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>Copied ✓</Text>
          </View>
        )}

        {/* Limit banner */}
        {limitReached && (
          <TouchableOpacity style={styles.limitBanner} onPress={() => router.push('/settings')}>
            <Text style={styles.limitText}>Daily limit reached — add your key in Settings →</Text>
          </TouchableOpacity>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Say anything..."
            placeholderTextColor={THEME.textDim}
            multiline
            editable={!limitReached}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading || limitReached) && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || loading || limitReached}
          >
            <Text style={styles.sendText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderDim,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerGlyph: { fontSize: 28 },
  headerTitle: { fontSize: 18, color: THEME.text, fontWeight: '300', letterSpacing: 3 },
  headerTagline: { fontSize: 10, color: THEME.textDim, marginTop: 1, fontStyle: 'italic' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakPill: {
    fontSize: 11,
    color: THEME.primary,
    backgroundColor: '#1A1000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A2800',
  },
  headerBtn: { padding: 6 },
  newChatBtn: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  newChatText: { fontSize: 12, color: THEME.textMuted, letterSpacing: 0.5 },
  settingsIcon: { fontSize: 18, color: THEME.textMuted },

  warningBanner: {
    backgroundColor: '#1A1000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3A2800',
  },
  warningText: { fontSize: 11, color: THEME.primary, textAlign: 'center' },

  questionCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 18,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderLeftWidth: 2,
    borderLeftColor: THEME.primary,
    borderRadius: 12,
  },
  questionLabel: { fontSize: 9, color: THEME.primary, letterSpacing: 2.5, marginBottom: 8 },
  questionText: { fontSize: 15, color: THEME.text, lineHeight: 23, marginBottom: 10 },
  questionHint: { fontSize: 11, color: THEME.textDim },

  promptsRow: { flexDirection: 'column', gap: 6, marginHorizontal: 16, marginTop: 8, marginBottom: 4 },
  promptChip: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  promptChipText: { fontSize: 13, color: THEME.textMuted, fontStyle: 'italic' },

  messageList: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  bubble: { maxWidth: '88%', padding: 14, borderRadius: 14 },
  welcomeBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingLeft: 4,
    maxWidth: '95%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1E1508',
    borderWidth: 1,
    borderColor: '#3A2A08',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  bubbleName: { fontSize: 10, letterSpacing: 1.5, marginBottom: 6 },
  bubbleText: { fontSize: 15, lineHeight: 23 },
  userText: { color: '#E8D098' },
  aiText: { color: THEME.text },
  bubbleActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  longPressHint: { fontSize: 9, color: THEME.textDim },
  copyBtn: { fontSize: 9, color: THEME.textDim },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  loadingGlyph: { fontSize: 14 },

  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#1A1100',
    borderWidth: 1,
    borderColor: THEME.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toastText: { color: THEME.primary, fontSize: 13 },

  limitBanner: {
    backgroundColor: '#1A1000',
    padding: 13,
    borderTopWidth: 1,
    borderTopColor: '#3A2800',
    alignItems: 'center',
  },
  limitText: { color: THEME.primary, fontSize: 13 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: THEME.borderDim,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: THEME.text,
    maxHeight: 120,
  },
  sendBtn: {
    backgroundColor: THEME.primary,
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: { opacity: 0.25 },
  sendText: { color: THEME.background, fontSize: 18, fontWeight: '700' },
});
