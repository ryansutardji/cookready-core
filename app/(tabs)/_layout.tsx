import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '@/app/_layout';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ShoppingBasket, ChefHat } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.tabBar, { paddingBottom: bottomPad, height: 52 + bottomPad }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const isFocused = state.index === index;
        const color = isFocused ? '#D2691E' : '#4A3728';

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity key={route.key} style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
            {options.tabBarIcon?.({ color, size: 22, focused: isFocused })}
            <Text style={[styles.label, { color }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFAF5',
    borderTopWidth: 1,
    borderTopColor: '#E8E0D0',
    alignItems: 'flex-start',
    paddingTop: 10,
    zIndex: 100,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    fontWeight: '600',
  },
});

export default function TabsLayout() {
  const { session, ready } = useAuth();

  if (ready && !session) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="pantry"
        options={{
          title: 'Pantry',
          tabBarIcon: ({ size, color }) => (
            <ShoppingBasket size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chef"
        options={{
          title: 'AI Chef',
          tabBarIcon: ({ size, color }) => (
            <ChefHat size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
