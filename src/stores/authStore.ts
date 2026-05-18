import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.');
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
      await signIn(email, password);
      return { signedIn: true };
    } catch {
      return { signedIn: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.');
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
