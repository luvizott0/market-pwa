<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Home, Users, CheckCircle2, AlertTriangle, ArrowRight, Star } from 'lucide-vue-next'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const token = computed(() => String(route.params.token || ''))

const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const inviteData = ref<{
  workspace_name: string
  invited_by_name?: string
  status: string
  is_pending: boolean
} | null>(null)

const setAsDefault = ref(true)

const canJoin = computed(() => {
  return authStore.workspaces.length < 3
})

onMounted(async () => {
  if (!token.value) {
    error.value = 'Token de convite não encontrado.'
    isLoading.value = false
    return
  }

  try {
    const res = await authService.getInvitationByToken(token.value)
    if (res?.data) {
      inviteData.value = res.data
      if (!res.data.is_pending) {
        error.value = 'Este convite já foi utilizado ou expirou.'
      }
    }
  } catch (err: any) {
    error.value = err.message || 'Convite inválido ou expirado.'
  } finally {
    isLoading.value = false
  }
})

const handleAccept = async () => {
  if (!token.value) return

  isSubmitting.value = true
  error.value = null

  try {
    const res = await authService.acceptInvitation(token.value)
    await authStore.fetchWorkspaces()

    if (res?.workspace?.id) {
      authStore.setActiveWorkspace(res.workspace.id)
      if (setAsDefault.value) {
        await authStore.setDefaultWorkspace(res.workspace.id)
      }
    }

    successMessage.value = res.message || 'Convite aceito com sucesso!'

    setTimeout(() => {
      router.push('/')
    }, 1500)
  } catch (err: any) {
    error.value = err.message || 'Falha ao aceitar convite.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6 text-center animate-in fade-in zoom-in-95">
      <!-- Icon -->
      <div class="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm shadow-emerald-500/10">
        <Home class="w-8 h-8 stroke-[2.2]" />
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-2 py-4">
        <div class="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs text-slate-500 font-medium">Carregando informações do convite...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="space-y-4">
        <div class="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2 text-left">
          <AlertTriangle class="w-4 h-4 shrink-0" />
          <span>{{ error }}</span>
        </div>
        <button
          type="button"
          @click="router.push('/')"
          class="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
        >
          Voltar ao Início
        </button>
      </div>

      <!-- Success State -->
      <div v-else-if="successMessage" class="space-y-4 py-2">
        <div class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-center gap-2">
          <CheckCircle2 class="w-5 h-5 text-emerald-600" />
          <span>{{ successMessage }}</span>
        </div>
        <p class="text-xs text-slate-500">Redirecionando para o espaço...</p>
      </div>

      <!-- Invitation Card -->
      <div v-else-if="inviteData" class="space-y-5">
        <div>
          <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            Convite para Espaço
          </span>
          <h2 class="text-xl font-extrabold text-slate-900 tracking-tight">
            {{ inviteData.workspace_name }}
          </h2>
          <p v-if="inviteData.invited_by_name" class="text-xs text-slate-500 font-medium mt-1">
            Convidado por <strong>{{ inviteData.invited_by_name }}</strong>
          </p>
        </div>

        <p class="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          Você terá acesso completo para visualizar, adicionar e editar produtos no estoque e na lista de compras deste espaço em tempo real.
        </p>

        <!-- Limit Check -->
        <div v-if="!canJoin" class="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl text-left flex items-start gap-2">
          <AlertTriangle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>Você já atingiu o limite de 3 espaços na sua conta. Remova ou saia de um espaço para poder aceitar este convite.</span>
        </div>

        <!-- Default Space Option -->
        <label v-if="canJoin" class="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition text-left text-xs font-semibold text-slate-700">
          <input
            v-model="setAsDefault"
            type="checkbox"
            class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500/20"
          />
          <div class="flex items-center gap-1.5">
            <Star class="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Definir "{{ inviteData.workspace_name }}" como meu espaço padrão</span>
          </div>
        </label>

        <!-- Actions -->
        <div class="pt-2 space-y-2">
          <button
            type="button"
            @click="handleAccept"
            :disabled="!canJoin || isSubmitting"
            class="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            <span>{{ isSubmitting ? 'Entrando no espaço...' : 'Aceitar Convite e Entrar' }}</span>
            <ArrowRight class="w-4 h-4" />
          </button>

          <button
            type="button"
            @click="router.push('/')"
            class="w-full py-2.5 rounded-2xl text-slate-500 hover:text-slate-800 text-xs font-semibold transition cursor-pointer"
          >
            Recusar / Voltar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
