import { api } from './api'

export interface User {
  id: number
  name: string
  email: string
  default_workspace_id?: number | null
}

export interface Workspace {
  id: number
  name: string
  is_personal?: boolean
  owner_id?: number
  role?: string
  is_default?: boolean
  members_count?: number
  created_at?: string
}

export interface WorkspaceMember {
  id: number
  name: string
  email: string
  role: string
}

export interface WorkspaceInvitation {
  id: number
  email?: string | null
  token: string
  status: string
  expires_at?: string
  created_at?: string
}

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    return api.post<{ token: string; user: User; workspaces: Workspace[] }>('/auth/login', credentials)
  },

  register: async (payload: { name: string; email: string; password: string; password_confirmation: string }) => {
    return api.post<{ token: string; user: User; workspaces: Workspace[] }>('/auth/register', payload)
  },

  getMe: async () => {
    return api.get<{ user: User; workspaces: Workspace[] }>('/auth/me')
  },

  logout: async () => {
    return api.post<{ message: string }>('/auth/logout')
  },

  changePassword: async (payload: {
    current_password: string
    password: string
    password_confirmation: string
  }) => {
    return api.put<{ message: string }>('/auth/password', payload)
  },

  getWorkspaces: async () => {
    return api.get<{ data: Workspace[] }>('/workspaces')
  },

  createWorkspace: async (name: string) => {
    return api.post<{ data: Workspace }>('/workspaces', { name })
  },

  updateWorkspace: async (id: number, name: string) => {
    return api.put<{ data: Workspace }>(`/workspaces/${id}`, { name })
  },

  setDefaultWorkspace: async (id: number) => {
    return api.post<{ message: string; default_workspace_id: number; workspace: Workspace }>(
      `/workspaces/${id}/set-default`
    )
  },

  getMembers: async (id: number) => {
    return api.get<{ data: WorkspaceMember[] }>(`/workspaces/${id}/members`)
  },

  getInvitations: async (id: number) => {
    return api.get<{ data: WorkspaceInvitation[] }>(`/workspaces/${id}/invitations`)
  },

  inviteMember: async (id: number, email?: string) => {
    return api.post<{ data: WorkspaceInvitation }>(`/workspaces/${id}/invitations`, {
      email: email?.trim() || null,
      role: 'member',
    })
  },

  getInvitationByToken: async (token: string) => {
    return api.get<{
      data: {
        token: string
        workspace_name: string
        invited_by_name?: string
        status: string
        is_pending: boolean
      }
    }>(`/invitations/${token}`)
  },

  acceptInvitation: async (token: string) => {
    return api.post<{ message: string; workspace?: Workspace }>(`/invitations/${token}/accept`)
  },
}
