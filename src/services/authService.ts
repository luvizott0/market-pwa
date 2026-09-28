import { api } from './api'

export interface User {
  id: number
  name: string
  email: string
}

export interface Workspace {
  id: number
  name: string
  slug?: string
  currency?: string
  is_owner?: boolean
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
}
