export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

  const token = localStorage.getItem('market_auth_token') || localStorage.getItem('flux_auth_token')
  const workspaceId = localStorage.getItem('market_active_workspace_id') || localStorage.getItem('flux_active_workspace_id')

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (workspaceId) {
    headers['X-Workspace-Id'] = workspaceId
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    let data: any = null
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('market_auth_token')
        localStorage.removeItem('flux_auth_token')
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('market:unauthorized'))
        }
      }

      const message =
        data?.message ||
        (data?.errors ? Object.values(data.errors).flat().join(', ') : `Erro na requisição (${response.status})`)
      throw new ApiError(message, response.status, data?.errors)
    }

    return data as T
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(error.message || 'Falha de comunicação com o servidor', 0)
  }
}

export const api = {
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
}
