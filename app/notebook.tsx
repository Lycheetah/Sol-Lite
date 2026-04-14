import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Alert
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getSavedReflections, deleteReflection, SavedReflection } from '../lib/storage';
import { THEME } from '../constants/theme';

const PATH_LABELS: Record<string, string> = {
  think: '⊚ Think Clearly',
  self: '✦ Know Yourself',
  build: '◈ Build',
  none: '⊚ Sol',
};

export default function Notebook() {
  const [reflections, setReflections] = useState<SavedReflection[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      getSavedReflections().then(setReflections);
    }, [])
  );

  async function handleDelete(id: string) {
    Alert.alert('Remove reflection', 'Remove this from your Notebook?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await deleteReflection(id);
          setReflections(prev => prev.filter(r => r.id !== id));
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
        <Text style={styles.headerTitle}>Notebook</Text>
        <View style={{ width: 60 }} />
      </View>

      {reflections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyGlyph}>◌</Text>
          <Text style={styles.emptyTitle}>No reflections yet</Text>
          <Text style={styles.emptyDesc}>
            Hold any Sol message in chat to save it here. The things worth keeping deserve a place.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reflections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onLongPress={() => handleDelete(item.id)}
              delayLongPress={600}
              activeOpacity={0.85}
            >
              <View style={styles.cardMeta}>
                <Text style={styles.cardPath}>{PATH_LABELS[item.path] ?? '⊚ Sol'}</Text>
                <Text style={styles.cardDate}>{item.date}</Text>
              </View>
              <Text style={styles.cardText}>{item.text}</Text>
              <Text style={styles.cardHint}>hold to remove</Text>
            </TouchableOpacity>
          )}
        />
      )}
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
  headerTitle: { fontSize: 16, color: THEME.text, fontWeight: '300', letterSpacing: 2 },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 14,
  },
  emptyGlyph: { fontSize: 48, color: THEME.textDim },
  emptyTitle: { fontSize: 18, color: THEME.textMuted, fontWeight: '300' },
  emptyDesc: { fontSize: 14, color: THEME.textDim, textAlign: 'center', lineHeight: 22 },

  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderLeftWidth: 2,
    borderLeftColor: THEME.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPath: { fontSize: 10, color: THEME.primary, letterSpacing: 1.5 },
  cardDate: { fontSize: 10, color: THEME.textDim },
  cardText: { fontSize: 14, color: THEME.text, lineHeight: 22 },
  cardHint: { fontSize: 9, color: THEME.textDim, textAlign: 'right' },
});
