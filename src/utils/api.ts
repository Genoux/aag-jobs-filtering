// utils/api.ts
import axios, { AxiosError } from 'axios'
import { ApiConfig, RequestOptions } from '@localtypes/common'

export class ApiClient {
  constructor(private config: ApiConfig) {}

  async request<T>(endpoint: string, options: RequestOptions): Promise<T> {
    try {
      const response = await axios({
        url: `${this.config.baseUrl}${endpoint}`,
        method: options.method,
        params: {
          key: this.config.apiKey,
          ...options.params,
        },
        data: options.data,
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
          ...options.headers,
        },
      })

      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      return new Error(
        `API Error: ${(axiosError.response?.data as Record<string, string>)?.message || axiosError.message}`,
      )
    }
    return error instanceof Error ? error : new Error('Unknown error occurred')
  }
}
