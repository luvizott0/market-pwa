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

  const activeWorkspace = computed(() => {
    if (!activeWorkspaceId.value) return workspaces.value[0] || null
    return workspaces.value.find((w) => String(w.id) === String(activeWorkspaceId.value)) || workspaces.value[0] || null
  })

  const defaultWorkspace = computed(() => {
    return (
      workspaces.value.find((w) => w.is_default || (user.value && w.id === user.value.default_workspace_id)) ||
      workspaces.value[0] ||
      null
    )
  })

  const canCreateSpace = computed(() => workspaces.value.length < 3)

  const setAuth = (authToken: string, userData: User, workspaceList: Workspace[] = []) => {
    token.value = authToken
    user.value = userData
    workspaces.value = workspaceList

    localStorage.setItem('market_auth_token', authToken)
    localStorage.setItem('flux_auth_token', authToken)

    if (workspaceList.length > 0) {
      // Pick default workspace if available, otherwise first workspace
      const defaultWs = workspaceList.find(
        (w) => w.is_default || (userData && w.id === userData.default_workspace_id)
      )
      const chosen = defaultWs || workspaceList[0]
      if (chosen && !activeWorkspaceId.value) {
        activeWorkspaceId.value = String(chosen.id)
        localStorage.setItem('market_active_workspace_id', String(chosen.id))
        localStorage.setItem('flux_active_workspace_id', String(chosen.id))
      }
    }
  }

  const setActiveWorkspace = (id: number | string) => {
    const stringId = String(id)
    if (activeWorkspaceId.value !== stringId) {
      activeWorkspaceId.value = stringId
      localStorage.setItem('market_active_workspace_id', stringId)
      localStorage.setItem('flux_active_workspace_id', stringId)

      // Notify other stores to refresh their data for this space
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('market:space-changed', { detail: { workspaceId: stringId } }))
      }
    }
  }

  const fetchWorkspaces = async () => {
    try {
      const res = await authService.getWorkspaces()
      if (res?.data) {
        workspaces.value = res.data
        if (
          activeWorkspaceId.value &&
          !workspaces.value.some((w) => String(w.id) === activeWorkspaceId.value) &&
          workspaces.value[0]
        ) {
          setActiveWorkspace(workspaces.value[0].id)
        }
      }
      return workspaces.value
    } catch (e) {
      console.warn('Erro ao atualizar lista de espaços:', e)
      return workspaces.value
    }
  }

  const setDefaultWorkspace = async (workspaceId: number) => {
    const res = await authService.setDefaultWorkspace(workspaceId)
    if (user.value) {
      user.value.default_workspace_id = workspaceId
    }
    workspaces.value.forEach((w) => {
      w.is_default = w.id === workspaceId
    })
    return res
  }

  const createSpace = async (name: string) => {
    if (workspaces.value.length >= 3) {
      throw new Error('Você pode ter no máximo 3 espaços.')
    }
    const res = await authService.createWorkspace(name.trim())
    await fetchWorkspaces()
    if (res?.data?.id) {
      setActiveWorkspace(res.data.id)
    }
    return res
  }

  const renameSpace = async (workspaceId: number, name: string) => {
    const res = await authService.updateWorkspace(workspaceId, name.trim())
    const target = workspaces.value.find((w) => w.id === workspaceId)
    if (target) {
      target.name = name.trim()
    }
    return res
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

      if (!activeWorkspaceId.value && response.workspaces?.length > 0) {
        const defaultWs = response.workspaces.find(
          (w) => w.is_default || (response.user && w.id === response.user.default_workspace_id)
        )
        const chosen = defaultWs || response.workspaces[0]
        if (chosen) {
          activeWorkspaceId.value = String(chosen.id)
          localStorage.setItem('market_active_workspace_id', activeWorkspaceId.value)
          localStorage.setItem('flux_active_workspace_id', activeWorkspaceId.value)
        }
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
    activeWorkspace,
    defaultWorkspace,
    canCreateSpace,
    isLoading,
    isAuthenticated,
    login,
    logout,
    setActiveWorkspace,
    setDefaultWorkspace,
    createSpace,
    renameSpace,
    fetchWorkspaces,
    ensureAuthenticated,
    setAuth,
    clearAuth,
  }
})
