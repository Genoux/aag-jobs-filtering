// types/common.ts
export interface ApiConfig {
  baseUrl: string
  apiKey: string
  headers?: Record<string, string>
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'DELETE'
  params?: Record<string, string>
  data?: unknown
  headers?: Record<string, string>
}

export interface ApiResponse<T> {
  error: boolean
  results: T
}
