<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  User,
  LogOut,
  Trash2,
  CheckCircle2,
  Layers,
  Home,
  Star,
  Pencil,
  Plus,
  Share2,
  Users,
  X,
  Copy,
  CheckCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useShoppingListStore } from '@/stores/shoppingList'
import { useInventoryStore } from '@/stores/inventory'
import { authService, type Workspace } from '@/services/authService'

const router = useRouter()
const authStore = useAuthStore()
const shoppingStore = useShoppingListStore()
const inventoryStore = useInventoryStore()

const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

// Create Space modal
const isCreateModalOpen = ref(false)
const newSpaceName = ref('')
const isCreating = ref(false)

// Rename Space modal
const isRenameModalOpen = ref(false)
const targetSpaceForRename = ref<Workspace | null>(null)
const renameInput = ref('')
const isRenaming = ref(false)

// Share Space modal
const isShareModalOpen = ref(false)
const targetSpaceForShare = ref<Workspace | null>(null)
const shareEmail = ref('')
const isInviting = ref(false)
const inviteSuccess = ref<string | null>(null)
const inviteError = ref<string | null>(null)
const generatedToken = ref<string | null>(null)
const isCopied = ref(false)

const spacesList = computed(() => authStore.workspaces)
const spacesCount = computed(() => authStore.workspaces.length)
const canCreate = computed(() => spacesCount.value < 3)

const showSuccess = (msg: string) => {
  successMessage.value = msg
  setTimeout(() => {
    successMessage.value = null
  }, 3500)
}

const handleSpaceChange = async (workspaceId: number) => {
  authStore.setActiveWorkspace(workspaceId)
  showSuccess('Espaço ativo alterado com sucesso.')
  await Promise.all([inventoryStore.refreshAll(), shoppingStore.fetchItems()])
}

const handleSetDefaultSpace = async (ws: Workspace) => {
  try {
    await authStore.setDefaultWorkspace(ws.id)
    showSuccess(`"${ws.name}" agora é o seu espaço padrão.`)
  } catch (err: any) {
    errorMessage.value = err.message || 'Falha ao definir espaço padrão.'
    setTimeout(() => {
      errorMessage.value = null
    }, 3500)
  }
}

// Rename
const openRenameModal = (ws: Workspace) => {
  targetSpaceForRename.value = ws
  renameInput.value = ws.name
  isRenameModalOpen.value = true
}

const handleSaveRename = async () => {
  if (!targetSpaceForRename.value || !renameInput.value.trim()) return

  isRenaming.value = true
  try {
    await authStore.renameSpace(targetSpaceForRename.value.id, renameInput.value.trim())
    showSuccess('Nome do espaço atualizado!')
    isRenameModalOpen.value = false
  } catch (err: any) {
    errorMessage.value = err.message || 'Falha ao renomear espaço.'
  } finally {
    isRenaming.value = false
  }
}

// Create
const openCreateModal = () => {
  newSpaceName.value = ''
  isCreateModalOpen.value = true
}

const handleCreateSpace = async () => {
  if (!newSpaceName.value.trim()) return

  isCreating.value = true
  try {
    await authStore.createSpace(newSpaceName.value.trim())
    showSuccess('Novo espaço criado com sucesso!')
    isCreateModalOpen.value = false
    newSpaceName.value = ''
    await Promise.all([inventoryStore.refreshAll(), shoppingStore.fetchItems()])
  } catch (err: any) {
    errorMessage.value = err.message || 'Falha ao criar espaço.'
  } finally {
    isCreating.value = false
  }
}

// Share
const openShareModal = async (ws: Workspace) => {
  targetSpaceForShare.value = ws
  shareEmail.value = ''
  inviteSuccess.value = null
  inviteError.value = null
  generatedToken.value = null
  isCopied.value = false
  isShareModalOpen.value = true

  try {
    const res = await authService.inviteMember(ws.id)
    if (res?.data?.token) {
      generatedToken.value = res.data.token
    }
  } catch (err) {
    console.warn('Erro ao gerar token de convite:', err)
  }
}

const inviteLinkUrl = computed(() => {
  if (!generatedToken.value || typeof window === 'undefined') return ''
  return `${window.location.origin}/invite/${generatedToken.value}`
})

const copyInviteLink = async () => {
  if (!inviteLinkUrl.value) return
  try {
    await navigator.clipboard.writeText(inviteLinkUrl.value)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2500)
  } catch (err) {
    console.error('Falha ao copiar:', err)
  }
}

const handleSendEmailInvite = async () => {
  if (!targetSpaceForShare.value || !shareEmail.value.trim()) return

  isInviting.value = true
  inviteSuccess.value = null
  inviteError.value = null

  try {
    await authService.inviteMember(targetSpaceForShare.value.id, shareEmail.value.trim())
    inviteSuccess.value = `Convite enviado para ${shareEmail.value.trim()}!`
    shareEmail.value = ''
  } catch (err: any) {
    inviteError.value = err.message || 'Falha ao enviar convite por e-mail.'
  } finally {
    isInviting.value = false
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6 pb-24 lg:pb-12">
    <!-- Success Alert -->
    <div
      v-if="successMessage"
      class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in"
    >
      <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
      <span>{{ successMessage }}</span>
    </div>

    <!-- Error Alert -->
    <div
      v-if="errorMessage"
      class="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in"
    >
      <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- User Profile Card -->
    <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
      <div class="flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
          {{ authStore.user?.name?.charAt(0) || 'U' }}
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-900">{{ authStore.user?.name || 'Usuário' }}</h2>
          <p class="text-xs text-slate-500 font-medium">{{ authStore.user?.email || 'email@exemplo.com' }}</p>
        </div>
      </div>
    </div>

    <!-- Spaces Management Card -->
    <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-base font-bold text-slate-900">Seus Espaços</h3>
            <span class="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold">
              {{ spacesCount }}/3 utilizados
            </span>
          </div>
          <p class="text-xs text-slate-500 font-medium mt-1">
            Cada espaço possui seu próprio estoque e lista de compras compartilhada em tempo real com os membros.
          </p>
        </div>

        <button
          v-if="canCreate"
          type="button"
          @click="openCreateModal"
          class="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs shadow-emerald-600/20"
        >
          <Plus class="w-4 h-4" />
          <span>Novo Espaço</span>
        </button>
      </div>

      <!-- Spaces List -->
      <div class="space-y-3">
        <div
          v-for="ws in spacesList"
          :key="ws.id"
          :class="[
            'p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3',
            String(ws.id) === String(authStore.activeWorkspaceId)
              ? 'bg-emerald-50/70 border-emerald-300'
              : 'border-slate-200 bg-white hover:bg-slate-50/50'
          ]"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              :class="String(ws.id) === String(authStore.activeWorkspaceId) ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'"
            >
              <Home class="w-5 h-5" />
            </div>

            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-slate-900 truncate">{{ ws.name }}</span>
                <button
                  type="button"
                  @click="openRenameModal(ws)"
                  title="Renomear espaço"
                  class="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <Pencil class="w-3.5 h-3.5" />
                </button>
              </div>

              <div class="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>{{ ws.members_count || 1 }} {{ (ws.members_count || 1) === 1 ? 'membro' : 'membros' }}</span>
                <span>•</span>
                <span
                  v-if="ws.is_default || (authStore.user && ws.id === authStore.user.default_workspace_id)"
                  class="text-amber-600 font-bold inline-flex items-center gap-1"
                >
                  <Star class="w-3 h-3 fill-amber-500 text-amber-500" />
                  Espaço Padrão
                </span>
                <button
                  v-else
                  type="button"
                  @click="handleSetDefaultSpace(ws)"
                  class="text-slate-400 hover:text-amber-600 font-semibold cursor-pointer transition flex items-center gap-1"
                >
                  <Star class="w-3 h-3" />
                  <span>Definir como padrão</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Actions per space -->
          <div class="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <button
              type="button"
              @click="openShareModal(ws)"
              class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 class="w-3.5 h-3.5" />
              <span>Convidar</span>
            </button>

            <button
              type="button"
              @click="handleSpaceChange(ws.id)"
              :disabled="String(ws.id) === String(authStore.activeWorkspaceId)"
              :class="[
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer',
                String(ws.id) === String(authStore.activeWorkspaceId)
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              ]"
            >
              {{ String(ws.id) === String(authStore.activeWorkspaceId) ? 'Ativo' : 'Alternar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Real-time Shopping List Status Card -->
    <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Lista de Compras Sincronizada</span>
          </h3>
          <p class="text-xs text-slate-500 font-medium mt-0.5">
            A lista deste espaço é atualizada na nuvem em tempo real com todos os membros convidados.
          </p>
        </div>

        <button
          type="button"
          @click="shoppingStore.fetchItems()"
          :disabled="shoppingStore.isLoading"
          class="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition cursor-pointer"
          title="Sincronizar agora"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': shoppingStore.isLoading }" />
        </button>
      </div>

      <div class="flex items-center justify-between pt-1 text-xs text-slate-600">
        <span>{{ shoppingStore.totalItemsCount }} itens na lista de compras deste espaço</span>
        <button
          v-if="shoppingStore.checkedCount > 0"
          type="button"
          @click="shoppingStore.removeChecked()"
          class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-semibold transition cursor-pointer"
        >
          Limpar Comprados ({{ shoppingStore.checkedCount }})
        </button>
      </div>
    </div>

    <!-- Logout -->
    <div class="pt-2">
      <button
        type="button"
        @click="handleLogout"
        class="w-full py-3 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
      >
        <LogOut class="w-4 h-4" />
        <span>Sair da Conta</span>
      </button>
    </div>

    <!-- Modal: Renomear Espaço -->
    <div
      v-if="isRenameModalOpen && targetSpaceForRename"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
    >
      <div
        class="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900">Renomear Espaço</h3>
          <button
            type="button"
            @click="isRenameModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleSaveRename" class="space-y-4 text-xs font-medium">
          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Nome do Espaço</label>
            <input
              v-model="renameInput"
              type="text"
              required
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
            />
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              @click="isRenameModalOpen = false"
              class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isRenaming"
              class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition cursor-pointer disabled:opacity-50"
            >
              {{ isRenaming ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Criar Espaço -->
    <div
      v-if="isCreateModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
    >
      <div
        class="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900">Novo Espaço ({{ spacesCount + 1 }}/3)</h3>
          <button
            type="button"
            @click="isCreateModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleCreateSpace" class="space-y-4 text-xs font-medium">
          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Nome do Espaço *</label>
            <input
              v-model="newSpaceName"
              type="text"
              required
              placeholder="Ex: Casa da Praia, Escritório..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
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
              class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition cursor-pointer disabled:opacity-50"
            >
              {{ isCreating ? 'Criando...' : 'Criar Espaço' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Compartilhar / Convidar -->
    <div
      v-if="isShareModalOpen && targetSpaceForShare"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
    >
      <div
        class="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Share2 class="w-4 h-4 text-emerald-600" />
            <h3 class="text-sm font-bold text-slate-900">Compartilhar "{{ targetSpaceForShare.name }}"</h3>
          </div>
          <button
            type="button"
            @click="isShareModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div v-if="inviteSuccess" class="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
          {{ inviteSuccess }}
        </div>
        <div v-if="inviteError" class="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
          {{ inviteError }}
        </div>

        <!-- Copy Link Section -->
        <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
          <label class="font-bold text-slate-600 block">Link de Convite</label>
          <p class="text-slate-500">Envie o link para quem você deseja convidar para gerenciar este espaço:</p>
          <div class="flex items-center gap-2 pt-1">
            <input
              type="text"
              readonly
              :value="inviteLinkUrl || 'Gerando link...'"
              class="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-700 select-all"
            />
            <button
              type="button"
              @click="copyInviteLink"
              :disabled="!generatedToken"
              class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <component :is="isCopied ? CheckCheck : Copy" class="w-3.5 h-3.5" />
              <span>{{ isCopied ? 'Copiado!' : 'Copiar' }}</span>
            </button>
          </div>
        </div>

        <!-- Send by Email Section -->
        <form @submit.prevent="handleSendEmailInvite" class="space-y-3 text-xs font-medium">
          <div class="space-y-1">
            <label class="text-slate-700 font-semibold block">Ou convidar por e-mail</label>
            <div class="flex items-center gap-2">
              <input
                v-model="shareEmail"
                type="email"
                placeholder="email@amigo.com"
                class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400"
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
  </div>
</template>
