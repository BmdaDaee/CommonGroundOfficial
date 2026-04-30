import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, focused }: { name: IoniconName; focused: boolean }) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as IoniconName)}
      size={24}
      color={focused ? '#ff6b6b' : '#666'}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#0f0f0f', borderTopColor: '#1a1a1a', borderTopWidth: 1, height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: '#ff6b6b',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />, headerTitle: 'CommonGround' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat', tabBarIcon: ({ focused }) => <TabIcon name="chatbubble" focused={focused} />, headerTitle: 'Chat' }} />
      <Tabs.Screen name="missions" options={{ title: 'Missions', tabBarIcon: ({ focused }) => <TabIcon name="flag" focused={focused} />, headerTitle: 'Missions & Sparks' }} />
      <Tabs.Screen name="vault" options={{ title: 'Vault', tabBarIcon: ({ focused }) => <TabIcon name="heart" focused={focused} />, headerTitle: 'Memory Vault' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />, headerTitle: 'Profile' }} />
    </Tabs>
  );
}
