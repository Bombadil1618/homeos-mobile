import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '@/src/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const REDIRECT_URL = Linking.createURL('auth');
  console.log('Redirect URL:', REDIRECT_URL);

  const handleSignInWithGoogle = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: REDIRECT_URL,
        },
      });

      if (error) {
        Alert.alert('Sign in failed', error.message);
        return;
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          REDIRECT_URL
        );

        if (result.type === 'success' && result.url) {
          const url = result.url;
          const hash = url.includes('#') ? url.split('#')[1] : '';
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            router.replace('/');
          } else {
            Alert.alert('Sign in failed', 'Could not complete sign in.');
          }
        }
      } else {
        Alert.alert('Sign in failed', 'No redirect URL returned.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      Alert.alert('Sign in failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
      <Text style={{ fontSize: 36, fontWeight: '700', color: '#111827', marginBottom: 8 }}>HomeOS</Text>
      <Text style={{ fontSize: 17, color: '#6B7280', marginBottom: 48, textAlign: 'center' }}>Your family's home, organized</Text>
      <TouchableOpacity
        onPress={handleSignInWithGoogle}
        style={{ backgroundColor: '#14B8A6', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, minWidth: 220, alignItems: 'center' }}
      >
        {loading ? (
          <ActivityIndicator color='#FFFFFF' size='small' />
        ) : (
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600' }}>Sign in with Google</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
