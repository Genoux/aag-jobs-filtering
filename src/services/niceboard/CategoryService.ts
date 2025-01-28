// services/niceboard/CategoryService.ts
import { logger } from '@utils'
import { BaseNiceboardService } from './base/BaseNiceboardService'

interface Category {
  id: number
  name: string
}

interface CategoriesApiResponse {
  categories: Category[]
}

export class CategoryService extends BaseNiceboardService {
  private readonly OTHER_CATEGORY_ID = 43998
  private categoryMapPromise: Promise<Record<string, number>> | null = null

  private async fetchCategoryMap(): Promise<Record<string, number>> {
    try {
      const response = await this.makeRequest<CategoriesApiResponse>('/categories', {
        method: 'GET',
      })

      if (!response.results?.categories?.length) {
        logger.warn('No categories available from API')
        return {}
      }

      const categoryMap = response.results.categories.reduce((map, category) => {
        map[category.name.toLowerCase()] = category.id
        return map
      }, {} as Record<string, number>)

      return categoryMap
    } catch (error) {
      logger.error('Failed to fetch category map', error)
      return {}
    }
  }

  private async getCategoryMap(): Promise<Record<string, number>> {
    if (!this.categoryMapPromise) {
      this.categoryMapPromise = this.fetchCategoryMap()
    }
    return this.categoryMapPromise
  }

  async getCategoryId(category: string): Promise<number> {
    try {
      const categoryMap = await this.getCategoryMap()
      const normalizedCategory = category.toLowerCase().trim()
      return categoryMap[normalizedCategory] || this.OTHER_CATEGORY_ID
    } catch (error) {
      logger.error(`Failed to handle category "${category}"`, error)
      return this.OTHER_CATEGORY_ID
    }
  }

  async getValidCategories(): Promise<object[]> {
    const categoryMap = await this.getCategoryMap()
    return Object.keys(categoryMap).map(key => ({ name: key, id: categoryMap[key] }))
  }
}