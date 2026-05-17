import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, Tabs, usePathname } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { uiPalette } from '@/constants/ui-palette';
import { useAnalysisFlow } from '@/context/analysis-flow-context';
import { useAuth } from '@/context/auth-context';

type TabIconProps = {
  focused: boolean;
  color: string;
  size: number;
  activeName: keyof typeof MaterialIcons.glyphMap;
  inactiveName: keyof typeof MaterialIcons.glyphMap;
};

function TabBarIcon(props: TabIconProps) {
  const { focused, color, size, activeName, inactiveName } = props;

  return (
    <View style={styles.iconWrap}>
      {focused ? <View style={styles.iconGlow} /> : null}
      <MaterialIcons
        name={focused ? activeName : inactiveName}
        size={size}
        color={focused ? uiPalette.tabActive : color}
        style={focused ? styles.iconActive : undefined}
      />
    </View>
  );
}

export default function TabLayout() {
  const { isLoading, session } = useAuth();
  const { isAnalyzing } = useAnalysisFlow();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const hideTabBar = isAnalyzing && pathname === '/';

  if (isLoading) {
    return null;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: uiPalette.onDark,
        tabBarInactiveTintColor: '#8EA1C4',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          display: hideTabBar ? 'none' : 'flex',
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: Math.max(insets.bottom, 6),
          height: 80,
          paddingTop: 8,
          paddingBottom: 10,
          paddingHorizontal: 10,
          backgroundColor: 'rgba(8, 23, 51, 0.94)',
          borderTopWidth: 1,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: 'rgba(120, 160, 220, 0.22)',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
          elevation: 18,
          shadowColor: '#000000',
          shadowOpacity: 0.35,
          shadowRadius: 28,
          shadowOffset: { width: 0, height: -8 },
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0,
          marginTop: -2,
        },
        tabBarItemStyle: {
          height: 56,
          borderRadius: 20,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarActiveBackgroundColor: 'transparent',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Аналіз',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              activeName="auto-awesome"
              inactiveName="camera-enhance"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Історія',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              activeName="schedule"
              inactiveName="history"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Чат',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              activeName="forum"
              inactiveName="chat-bubble-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Профіль',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              activeName="account-circle"
              inactiveName="person-outline"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 34,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 136, 255, 0.16)',
  },
  iconActive: {
    textShadowColor: 'rgba(47, 140, 255, 0.8)',
    textShadowRadius: 12,
  },
});
