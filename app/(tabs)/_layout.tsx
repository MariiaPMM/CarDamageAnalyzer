import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, Tabs, usePathname } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { uiPalette } from '@/constants/ui-palette';
import { useAnalysisFlow } from '@/context/analysis-flow-context';
import { useAuth } from '@/context/auth-context';

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
				tabBarInactiveTintColor: uiPalette.textSoft,
				tabBarStyle: {
					display: hideTabBar ? 'none' : 'flex',
					position: 'absolute',
					left: 16,
					right: 16,
					bottom: Math.max(insets.bottom, 10),
					height: 70,
					paddingTop: 8,
					paddingBottom: 10,
					backgroundColor: uiPalette.tabBar,
					borderRadius: 28,
					borderWidth: 1,
					elevation: 14,
					shadowColor: uiPalette.primary,
					shadowOpacity: 0.24,
					shadowRadius: 32,
					shadowOffset: { width: 5, height: 16 },
				},
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: '700',
					letterSpacing: 0,
				},
				tabBarItemStyle: {
					marginHorizontal: 4,
					marginVertical: 2,
					height: 50,
				},
				tabBarIconStyle: {
					marginBottom: 2,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Аналіз',
					tabBarIcon: ({ color, size, focused }) => (
						<MaterialIcons
							name={focused ? 'auto-awesome' : 'camera-enhance'}
							size={size}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="history"
				options={{
					title: 'Історія',
					tabBarIcon: ({ color, size, focused }) => (
						<MaterialIcons
							name={focused ? 'schedule' : 'history'}
							size={size}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="explore"
				options={{
					title: 'Профіль',
					tabBarIcon: ({ color, size, focused }) => (
						<MaterialIcons
							name={focused ? 'account-circle' : 'person-outline'}
							size={size}
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
