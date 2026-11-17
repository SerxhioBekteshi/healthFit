import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ErrorState } from '@/components/ui/EmptyState';
import { LoadingView } from '@/components/ui/LoadingView';
import { ScreenContainer } from '@/components/ui/Screen';
import { useTranslation } from '@/i18n';
import { AppProviders } from '@/providers/AppProviders';
import { useSession } from '@/providers/SessionProvider';
import { useTheme } from '@/theme';

// Keep the splash screen up until the saved session has been checked.
void SplashScreen.preventAutoHideAsync();

const RootNavigator: React.FC = () => {
  const { status, retry } = useSession();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    if (status !== 'loading') void SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') {
    return (
      <ScreenContainer>
        <LoadingView fill />
      </ScreenContainer>
    );
  }

  if (status === 'unreachable') {
    return (
      <ScreenContainer>
        <ErrorState
          message={t(
            'We could not reach the gym server. Check your connection and try again.'
          )}
          onRetry={retry}
        />
      </ScreenContainer>
    );
  }

  const signedIn = status === 'signedIn';

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {/* Only members who are signed in reach the app; everyone else lands on the sign-in screen. */}
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="balance" options={{ title: t('Balance') }} />
          <Stack.Screen name="attendance" options={{ title: t('My visits') }} />
          <Stack.Screen
            name="locations"
            options={{ title: t('Gym locations') }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </>
  );
};

export default function RootLayout(): React.ReactElement {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
