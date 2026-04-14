import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { isOnboardingDone } from '../lib/storage';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    isOnboardingDone().then((done) => {
      if (done) {
        router.replace('/chat');
      } else {
        router.replace('/onboarding');
      }
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color="#C9A84C" />
    </View>
  );
}
