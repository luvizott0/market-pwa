import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService, type User, type Workspace } from '@/services/authService'

export const useAuthStore = defineStore('market_auth', () => {
  const token = ref<string | null>(
    localStorage.getItem('market_auth_token') || localStorage.getItem('flux_auth_token')
  )
  const activeWorkspaceId = ref<string | null>(
    localStorage.getItem('market_active_workspace_id') || localStorage.getItem('flux_active_workspace_id')
  )
  const user = ref<User | null>(null)
  const workspaces = ref<Workspace[]>([])
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  const setAuth = (authToken: string, userData: User, workspaceList: Workspace[] = []) => {
    token.value = authToken
    user.value = userData
    workspaces.value = workspaceList

    localStorage.setItem('market_auth_token', authToken)
    // Also sync to flux_auth_token so credentials share seamlessly
    localStorage.setItem('flux_auth_token', authToken)

    if (workspaceList.length > 0 && !activeWorkspaceId.value && workspaceList[0]) {
      activeWorkspaceId.value = String(workspaceList[0].id)
      localStorage.setItem('market_active_workspace_id', String(workspaceList[0].id))
      localStorage.setItem('flux_active_workspace_id', String(workspaceList[0].id))
    }
  }

  const setActiveWorkspace = (id: number | string) => {
    activeWorkspaceId.value = String(id)
    localStorage.setItem('market_active_workspace_id', String(id))
    localStorage.setItem('flux_active_workspace_id', String(id))
  }

  const clearAuth = () => {
    token.value = null
    user.value = null
    workspaces.value = []
    activeWorkspaceId.value = null
    localStorage.removeItem('market_auth_token')
    localStorage.removeItem('market_active_workspace_id')
  }

  const login = async (email: string, password: string) => {
    isLoading.value = true
    try {
      const response = await authService.login({ email, password })
      setAuth(response.token, response.user, response.workspaces)
      return response
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      if (token.value) {
        await authService.logout()
      }
    } catch (e) {
      console.warn('Erro ao deslogar da API', e)
    } finally {
      clearAuth()
    }
  }

  const ensureAuthenticated = async (): Promise<boolean> => {
    if (!token.value) {
      return false
    }

    try {
      const response = await authService.getMe()
      user.value = response.user
      workspaces.value = response.workspaces
      if (!activeWorkspaceId.value && response.workspaces?.length > 0 && response.workspaces[0]) {
        activeWorkspaceId.value = String(response.workspaces[0].id)
        localStorage.setItem('market_active_workspace_id', activeWorkspaceId.value)
        localStorage.setItem('flux_active_workspace_id', activeWorkspaceId.value)
      }
      return true
    } catch (err: any) {
      if (err.status === 401) {
        clearAuth()
      }
      return false
    }
  }

  return {
    token,
    user,
    workspaces,
    activeWorkspaceId,
    isLoading,
    isAuthenticated,
    login,
    logout,
    setActiveWorkspace,
    ensureAuthenticated,
    setAuth,
    clearAuth,
  }
})
