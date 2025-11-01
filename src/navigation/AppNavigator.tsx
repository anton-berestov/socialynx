import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MainScreen } from '../screens/MainScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { GenerationDetailsScreen } from '../screens/GenerationDetailsScreen';
import { RootStackParamList, TabParamList } from './types';
import { colors } from '../styles/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

function TabsNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { borderTopColor: '#E5E7EB', backgroundColor: '#fff' },
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'Home' ? 'lightbulb-on-outline' : route.name === 'History' ? 'clock-outline' : 'account-circle-outline';
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        }
      })}
    >
      <Tabs.Screen name="Home" component={MainScreen} options={{ title: 'Главная' }} />
      <Tabs.Screen name="History" component={HistoryScreen} options={{ title: 'История' }} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профиль' }} />
    </Tabs.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Paywall" component={PaywallScreen} options={{ title: 'SociaLynx PRO' }} />
      <Stack.Screen
        name="GenerationDetails"
        component={GenerationDetailsScreen}
        options={{ title: 'Детали генерации', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
