import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const USERNAME_DOMAIN = 'tracker.local';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  let initialized = false;

  const isLoggedIn = computed(() => Boolean(user.value));

  const init = async () => {
    if (!supabase || initialized) return;
    initialized = true;
    const { data } = await supabase.auth.getSession();
    user.value = data.session?.user ?? null;
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null;
    });
  };

  const normalizeLoginId = (raw: string) => {
    const value = raw.trim().toLowerCase();
    if (!value) throw new Error('Username is required.');
    if (value.includes('@')) return value;
    return `${value}@${USERNAME_DOMAIN}`;
  };

  const signUp = async (loginId: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const email = normalizeLoginId(loginId);
    isLoading.value = true;
    error.value = null;
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    isLoading.value = false;
    if (signUpError) {
      error.value = signUpError.message;
      throw signUpError;
    }
    if (data.session?.user) {
      user.value = data.session.user;
      return { signedIn: true };
    }
    try {
      await signIn(loginId, password);
      return { signedIn: true };
    } catch {
      return { signedIn: false };
    }
  };

  const signIn = async (loginId: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const email = normalizeLoginId(loginId);
    isLoading.value = true;
    error.value = null;
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    isLoading.value = false;
    if (signInError) {
      error.value = signInError.message;
      throw signInError;
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut({ scope: 'local' });
    user.value = null;
  };

  const signInAnonymously = async () => {
    if (!supabase) throw new Error('Supabase is not configured.');
    isLoading.value = true;
    error.value = null;
    const { error: anonError } = await supabase.auth.signInAnonymously();
    isLoading.value = false;
    if (anonError) {
      error.value = anonError.message;
      throw anonError;
    }
  };

  return { user, isLoading, error, isLoggedIn, init, signUp, signIn, signOut, signInAnonymously };
});
