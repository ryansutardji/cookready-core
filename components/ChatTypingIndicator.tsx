import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export function ChatTypingIndicator() {
  return (
    <View style={styles.thinkingContainer}>
      <View style={styles.thinkingAvatar}>
        <View style={styles.thinkingAvatarInner}>
          <Text style={styles.thinkingAvatarText}>🍳</Text>
        </View>
      </View>
      <View style={styles.thinkingBubble}>
        <ActivityIndicator size="small" color="#D2691E" />
        <Text
          style={[styles.thinkingText, { fontFamily: 'NotoSerif_700Bold' }]}
        >
          Thinking up something delicious...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  thinkingContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  thinkingAvatar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    marginLeft: 4,
  },
  thinkingAvatarInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D2691E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thinkingAvatarText: {
    color: '#fff',
    fontSize: 12,
  },
  thinkingBubble: {
    backgroundColor: '#F5EFE6',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    color: 'rgba(44,24,16,0.6)',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
