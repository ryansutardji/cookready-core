import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { ChefHat } from 'lucide-react-native';

interface Props {
  remaining: number;
  resetTime: string;
}

function PartialRingIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24">
      {/* Track */}
      <Circle
        cx={12}
        cy={12}
        r={9}
        fill="none"
        stroke="#E0D5C5"
        strokeWidth={3.4}
      />
      {/* Arc */}
      <Path
        d="M12 3 a9 9 0 0 1 7.79 13.5"
        fill="none"
        stroke="#D2691E"
        strokeWidth={3.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function RecipeLimitIndicator({ remaining, resetTime }: Props) {
  // Exhausted or last recipe — amber banner
  if (remaining <= 1) {
    const title = remaining === 0 ? 'No recipes left today' : 'Last recipe for today';

    return (
      <View style={styles.bannerContainer}>
        <ChefHat size={17} color="#B45309" strokeWidth={2} style={styles.bannerIcon} />
        <View style={styles.bannerTextBlock}>
          <Text style={[styles.bannerTitle, { fontFamily: 'Inter_700Bold' }]}>
            {title}
          </Text>
          <Text style={[styles.bannerSubtitle, { fontFamily: 'Inter_400Regular' }]}>
            Your 5 daily recipes reset at {resetTime}
          </Text>
        </View>
      </View>
    );
  }

  // Everyday state (remaining >= 2) — stone pill
  return (
    <View style={styles.pillContainer}>
      <PartialRingIcon />
      <Text style={[styles.pillText, { fontFamily: 'Inter_500Medium' }]}>
        {remaining} recipes left today
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pillContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5EFE6',
    borderWidth: 1,
    borderColor: '#E0D5C5',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 11,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillText: {
    fontSize: 11.5,
    color: '#8A6F58',
  },
  bannerContainer: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F1D38C',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerIcon: {
    flexShrink: 0,
  },
  bannerTextBlock: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  bannerTitle: {
    fontSize: 12.5,
    color: '#B45309',
  },
  bannerSubtitle: {
    fontSize: 10.5,
    color: 'rgba(180, 83, 9, 0.78)',
    lineHeight: 14,
  },
});
