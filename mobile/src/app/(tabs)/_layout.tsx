import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import { msg, useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// The five items of the menu. "Profile" holds everything else (balance, visits, gym locations, settings).
const TABS: {
  name: string;
  title: string;
  icon: IconName;
  activeIcon: IconName;
}[] = [
  {
    name: 'index',
    title: msg('Home'),
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    name: 'membership',
    title: msg('Membership'),
    icon: 'ticket-outline',
    activeIcon: 'ticket',
  },
  {
    name: 'check-in',
    title: msg('Check-in'),
    icon: 'qr-code-outline',
    activeIcon: 'qr-code',
  },
  {
    name: 'training',
    title: msg('Training'),
    icon: 'barbell-outline',
    activeIcon: 'barbell',
  },
  {
    name: 'profile',
    title: msg('Profile'),
    icon: 'person-outline',
    activeIcon: 'person',
  },
];

export default function TabsLayout(): React.ReactElement {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.title),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? tab.activeIcon : tab.icon}
                size={size}
                color={typeof color === 'string' ? color : colors.accent}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
