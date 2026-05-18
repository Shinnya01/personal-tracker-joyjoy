<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Card from '../components/ui/Card.vue';
import CardHeader from '../components/ui/CardHeader.vue';
import CardTitle from '../components/ui/CardTitle.vue';
import CardDescription from '../components/ui/CardDescription.vue';
import CardContent from '../components/ui/CardContent.vue';
import Input from '../components/ui/Input.vue';
import Button from '../components/ui/Button.vue';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { hasSupabaseConfig } from '../lib/supabase';

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUiStore();
const username = ref('');
const password = ref('');

onMounted(async () => {
  await authStore.init();
  if (authStore.isLoggedIn) await router.replace('/');
});

const signIn = async () => {
  try {
    await authStore.signIn(username.value.trim(), password.value);
    await router.replace('/');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign in failed.';
    uiStore.pushToast({ tone: 'error', text: message });
  }
};

const signUp = async () => {
  try {
    const result = await authStore.signUp(username.value.trim(), password.value);
    if (result.signedIn) {
      uiStore.pushToast({ tone: 'success', text: 'Account created and signed in.' });
      await router.replace('/');
      return;
    }
    uiStore.pushToast({ tone: 'success', text: 'Account created. Check your email if confirmation is required.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign up failed.';
    uiStore.pushToast({ tone: 'error', text: message });
  }
};

</script>

<template>
  <section class="mx-auto grid min-h-screen w-full max-w-md place-items-center p-5">
    <Card class="w-full rounded-3xl">
      <CardHeader>
        <CardTitle class="text-3xl font-extrabold text-slate-900">Login</CardTitle>
        <CardDescription class="text-sm text-slate-500">Sign in to sync trackers across phones.</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-3">
        <p v-if="!hasSupabaseConfig" class="text-xs text-rose-600">Missing Supabase env config. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.</p>
        <Input v-model="username" type="text" placeholder="Username" class="h-11 rounded-2xl text-sm" />
        <Input v-model="password" type="password" placeholder="Password" class="h-11 rounded-2xl text-sm" />
        <div class="flex gap-2">
          <Button class="flex-1" :disabled="authStore.isLoading || !hasSupabaseConfig" @click="signIn">Login</Button>
          <Button class="flex-1" variant="secondary" :disabled="authStore.isLoading || !hasSupabaseConfig" @click="signUp">Signup</Button>
        </div>
      </CardContent>
    </Card>
  </section>
</template>
