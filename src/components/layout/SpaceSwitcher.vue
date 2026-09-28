<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Home,
  ChevronDown,
  Check,
  Star,
  Plus,
  Share2,
  Users,
  Settings,
  Sparkles,
  X,
  Copy,
  CheckCheck,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { authService, type Workspace } from '@/services/authService'

const authStore = useAuthStore()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// Create space modal
const isCreateModalOpen = ref(false)
const newSpaceName = ref('')
const isCreating = ref(false)
const createError = ref<string | null>(null)

// Share space modal
const isShareModalOpen = ref(false)
const shareSpaceTarget = ref<Workspace | null>(null)
const inviteEmail = ref('')
const isInviting = ref(false)
const inviteError = ref<string | null>(null)
const inviteSuccess = ref<string | null>(null)
const generatedInviteToken = ref<string | null>(null)
const isCopied = ref(false)

const activeSpace = computed(() => authStore.activeWorkspace)
const spacesList = computed(() => authStore.workspaces)
const spacesCount = computed(() => authStore.workspaces.length)
const canCreate = computed(() => spacesCount.value < 3)

const inviteUrl = computed(() => {
  if (!generatedInviteToken.value || typeof window === 'undefined') return ''
  return `${window.location.origin}/invite/${generatedInviteToken.value}`
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleSelectSpace = (ws: Workspace) => {
  authStore.setActiveWorkspace(ws.id)
  closeDropdown()
}

const handleSetDefault = async (ws: Workspace, e: Event) => {
  e.stopPropagation()
  try {
    await authStore.setDefaultWorkspace(ws.id)
  } catch (err: any) {
    console.error('Falha ao definir espaço padrão:', err)
  }
}

// Create Space
const openCreateModal = () => {
  closeDropdown()
  newSpaceName.value = ''
  createError.value = null
  isCreateModalOpen.value = true
}

const handleCreateSpace = async () => {
  if (!newSpaceName.value.trim()) {
    createError.value = 'Informe o nome do espaço.'
    return
  }

  isCreating.value = true
  createError.value = null

  try {
    await authStore.createSpace(newSpaceName.value.trim())
    isCreateModalOpen.value = false
    newSpaceName.value = ''
  } catch (err: any) {
    createError.value = err.message || 'Falha ao criar novo espaço.'
  } finally {
    isCreating.value = false
  }
}

// Share Space
const openShareModal = async (ws: Workspace, e?: Event) => {
  if (e) e.stopPropagation()
  closeDropdown()
  shareSpaceTarget.value = ws
  inviteEmail.value = ''
  inviteError.value = null
  inviteSuccess.value = null
  generatedInviteToken.value = null
  isCopied.value = false
  isShareModalOpen.value = true

  // Automatically generate an invite link for quick copying
  try {
    const res = await authService.inviteMember(ws.id)
    if (res?.data?.token) {
      generatedInviteToken.value = res.data.token
    }
  } catch (err) {
    console.warn('Não foi possível gerar link imediato:', err)
  }
}

const copyInviteLink = async () => {
  if (!generatedInviteToken.value) return
  const fullUrl = `${window.location.origin}/invite/${generatedInviteToken.value}`
  try {
    await navigator.clipboard.writeText(fullUrl)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2500)
  } catch (err) {
    console.error('Falha ao copiar link:', err)
  }
}

const handleSendEmailInvite = async () => {
  if (!inviteEmail.value.trim() || !shareSpaceTarget.value) {
    inviteError.value = 'Informe um e-mail válido.'
    return
  }

  isInviting.value = true
  inviteError.value = null
  inviteSuccess.value = null

  try {
    await authService.inviteMember(shareSpaceTarget.value.id, inviteEmail.value.trim())
    inviteSuccess.value = `Convite enviado com sucesso para ${inviteEmail.value.trim()}!`
    inviteEmail.value = ''
  } catch (err: any) {
    inviteError.value = err.message || 'Falha ao enviar convite.'
  } finally {
    isInviting.value = false
  }
}
</script>

<template>
  <div ref="dropdownRef" class="relative inline-block text-left">
    <!-- Active Space Trigger Button -->
    <button
      type="button"
      @click="toggleDropdown"
      class="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold transition cursor-pointer border border-slate-200/60 shadow-2xs"
    >
      <div class="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
        <Home class="w-3 h-3" />
      </div>
      <span class="max-w-[110px] sm:max-w-[150px] truncate">{{ activeSpace?.name || 'Casa' }}</span>
      <span
        v-if="activeSpace?.is_default || (authStore.user && activeSpace?.id === authStore.user.default_workspace_id)"
        class="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded-md"
        title="Espaço padrão da sua conta"
      >
        <Star class="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
        <span>Padrão</span>
      </span>
      <ChevronDown class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" :class="{ 'rotate-180': isOpen }" />
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      class="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-slate-200/90 z-50 p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Dropdown Header -->
      <div class="px-2 py-1 flex items-center justify-between border-b border-slate-100 pb-2">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Alternar Espaço</span>
          <p class="text-xs font-bold text-slate-700">Seus Espaços ({{ spacesCount }}/3)</p>
        </div>
        <button
          v-if="canCreate"
          type="button"
          @click="openCreateModal"
          class="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer hover:bg-emerald-50 px-2 py-1 rounded-xl transition"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Novo</span>
        </button>
      </div>

      <!-- Spaces List -->
      <div class="space-y-1 max-h-60 overflow-y-auto pr-0.5">
        <div
          v-for="ws in spacesList"
          :key="ws.id"
          @click="handleSelectSpace(ws)"
          :class="[
            'p-2.5 rounded-2xl border transition cursor-pointer flex items-center justify-between text-xs',
            String(ws.id) === String(authStore.activeWorkspaceId)
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
              : 'border-slate-100 hover:bg-slate-50 text-slate-700 font-semibold'
          ]"
        >
          <div class="min-w-0 flex items-center gap-2.5">
            <div
              class="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
              :class="String(ws.id) === String(authStore.activeWorkspaceId) ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'"
            >
              <Home class="w-3.5 h-3.5" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="truncate block">{{ ws.name }}</span>
                <span
                  v-if="ws.is_default || (authStore.user && ws.id === authStore.user.default_workspace_id)"
                  class="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1 py-0.2 rounded"
                  title="Espaço padrão"
                >
                  ⭐
                </span>
              </div>
              <span class="text-[10px] text-slate-400 font-normal">
                {{ ws.members_count || 1 }} {{ (ws.members_count || 1) === 1 ? 'membro' : 'membros' }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <!-- Share button -->
            <button
              type="button"
              @click="openShareModal(ws, $event)"
              title="Compartilhar espaço"
              class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
            >
              <Share2 class="w-3.5 h-3.5" />
            </button>

            <!-- Set as default button -->
            <button
              v-if="!(ws.is_default || (authStore.user && ws.id === authStore.user.default_workspace_id))"
              type="button"
              @click="handleSetDefault(ws, $event)"
              title="Definir como espaço padrão"
              class="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
            >
              <Star class="w-3.5 h-3.5" />
            </button>

            <!-- Check indicator for active space -->
            <span
              v-if="String(ws.id) === String(authStore.activeWorkspaceId)"
              class="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 ml-0.5"
            >
              <Check class="w-3 h-3 stroke-[3]" />
            </span>
          </div>
        </div>
      </div>

      <!-- Max spaces reached note -->
      <div v-if="!canCreate" class="px-2 py-1 text-[11px] text-slate-400 text-center font-medium">
        Limite máximo de 3 espaços atingido.
      </div>
    </div>
  </div>

  <!-- Modal: Criar Novo Espaço -->
  <div
    v-if="isCreateModalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
  >
    <div
      class="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Plus class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-900">Novo Espaço</h3>
            <p class="text-[11px] text-slate-500 font-medium">Crie até 3 espaços para gerenciar</p>
          </div>
        </div>
        <button
          type="button"
          @click="isCreateModalOpen = false"
          class="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div v-if="createError" class="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl">
        {{ createError }}
      </div>

      <form @submit.prevent="handleCreateSpace" class="space-y-4 text-xs font-medium">
        <div class="space-y-1">
          <label class="text-slate-700 font-semibold block">Nome do Espaço *</label>
          <input
            v-model="newSpaceName"
            type="text"
            required
            placeholder="Ex: Casa de Praia, Sítio, Escritório"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition"
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            @click="isCreateModalOpen = false"
            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="isCreating"
            class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition cursor-pointer shadow-sm shadow-emerald-600/20 disabled:opacity-50"
          >
            {{ isCreating ? 'Criando...' : 'Criar Espaço' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal: Compartilhar Espaço -->
  <div
    v-if="isShareModalOpen && shareSpaceTarget"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
  >
    <div
      class="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Share2 class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-900">Compartilhar "{{ shareSpaceTarget.name }}"</h3>
            <p class="text-[11px] text-slate-500 font-medium">Convide outros usuários para gerenciar juntos</p>
          </div>
        </div>
        <button
          type="button"
          @click="isShareModalOpen = false"
          class="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div v-if="inviteError" class="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl">
        {{ inviteError }}
      </div>

      <div v-if="inviteSuccess" class="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl">
        {{ inviteSuccess }}
      </div>

      <!-- Copy Direct Link Section -->
      <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
        <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
          Link de Convite Rápido
        </label>
        <p class="text-xs text-slate-600">
          Envie este link para quem você deseja convidar. Ao aceitar, o usuário terá acesso total ao estoque e lista deste espaço:
        </p>
        <div class="flex items-center gap-2 pt-1">
          <input
            type="text"
            readonly
            :value="inviteUrl || 'Gerando link...'"
            class="flex-1 px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 text-slate-700 select-all"
          />
          <button
            type="button"
            @click="copyInviteLink"
            :disabled="!generatedInviteToken"
            class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
          >
            <component :is="isCopied ? CheckCheck : Copy" class="w-3.5 h-3.5" />
            <span>{{ isCopied ? 'Copiado!' : 'Copiar' }}</span>
          </button>
        </div>
      </div>

      <!-- Invite by Email Section -->
      <form @submit.prevent="handleSendEmailInvite" class="space-y-3 text-xs font-medium">
        <div class="space-y-1">
          <label class="text-slate-700 font-semibold block">Ou convidar por e-mail</label>
          <div class="flex items-center gap-2">
            <input
              v-model="inviteEmail"
              type="email"
              placeholder="email@amigo.com"
              class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition"
            />
            <button
              type="submit"
              :disabled="isInviting"
              class="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer shrink-0 disabled:opacity-50"
            >
              {{ isInviting ? 'Enviando...' : 'Convidar' }}
            </button>
          </div>
        </div>
      </form>

      <div class="pt-2 text-center">
        <button
          type="button"
          @click="isShareModalOpen = false"
          class="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>
