<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Store, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref<string | null>(null)
const isSubmitting = ref(false)

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Preencha seu e-mail e senha.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    await authStore.login(email.value, password.value)
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (err: any) {
    errorMessage.value = err.message || 'Credenciais inválidas. Verifique seu e-mail e senha.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto p-4 sm:p-6">
    <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xl shadow-slate-900/5 space-y-6">
      <!-- Brand header -->
      <div class="text-center space-y-2">
        <div class="w-14 h-14 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <Store class="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Market PWA</h1>
        <p class="text-xs text-slate-500 font-medium">
          Acesse para gerenciar seu estoque residencial e listas de mercado
        </p>
      </div>

      <!-- Error message -->
      <div
        v-if="errorMessage"
        class="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2 text-xs font-medium"
      >
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-4 text-xs font-medium">
        <div class="space-y-1">
          <label class="text-slate-700 font-semibold block">E-mail</label>
          <div class="relative">
            <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="email"
              type="email"
              required
              placeholder="seu@email.com"
              class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-slate-700 font-semibold block">Senha</label>
          <div class="relative">
            <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
        >
          <span>{{ isSubmitting ? 'Entrando...' : 'Entrar no App' }}</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </form>
    </div>
  </div>
</template>
