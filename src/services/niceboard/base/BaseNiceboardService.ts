// services/niceboard/base/BaseNiceboardService.ts
import { ApiResponse, RequestOptions } from '@localtypes/common'
import { NiceboardConfig } from '@localtypes/niceboard'
import { ApiClient, CacheManager, logger } from '@utils'

export abstract class BaseNiceboardService {
  protected readonly apiClient: ApiClient
  protected readonly cache: CacheManager<string, number>

  constructor(protected readonly config: NiceboardConfig) {
    if (!config.apiBaseUrl) {
      throw new Error('apiBaseUrl is required in config')
    }
    if (!config.apiKey) {
      throw new Error('apiKey is required in config')
    }
    this.config = config
    this.apiClient = new ApiClient({
      baseUrl: config.apiBaseUrl,
      apiKey: config.apiKey,
    })
    this.cache = new CacheManager()
  }

  protected async makeRequest<T>(
    endpoint: string,
    options: RequestOptions,
  ): Promise<ApiResponse<T>> {
    try {
      return await this.apiClient.request(endpoint, options)
    } catch (error) {
      logger.error(`Request failed: ${endpoint}`, error)
      throw error
    }
  }
}
