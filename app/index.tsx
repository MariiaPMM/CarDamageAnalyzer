import { Redirect } from 'expo-router';

import { useAuth } from '@/context/auth-context';

export default function IndexScreen() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return null;
  }

  return <Redirect href={session ? '/(tabs)' : '/login'} />;
}
