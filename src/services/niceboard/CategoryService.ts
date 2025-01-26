// services/niceboard/CategoryService.ts
import { logger, findBestMatch } from '@utils'
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

  private splitCategories(categoryString: string): string[] {
    return categoryString
      .replace(/\s+and\s+/g, ',')
      .split(/[,&]/)
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0)
  }

  async getCategoryId(categoryString: string): Promise<number> {
    try {
      const categories = this.splitCategories(categoryString)
      
      const cachedId = this.cache.get(categoryString)
      if (cachedId) {
        return cachedId
      }

      const response = await this.makeRequest<CategoriesApiResponse>('/categories', {
        method: 'GET',
      })

      if (!response.results?.categories?.length) {
        logger.info(
          `No categories available in the API yet. Using default ID: ${this.OTHER_CATEGORY_ID} (Other)`
        )
        return this.OTHER_CATEGORY_ID
      }

      for (const category of categories) {
        const exactMatch = response.results.categories.find(
          cat => cat.name.toLowerCase() === category.toLowerCase()
        )
        if (exactMatch) {
          logger.info(`Found exact match: ${category} -> ${exactMatch.name}`)
          return exactMatch.id
        }
      }

      for (const category of categories) {
        const fuzzyMatch = findBestMatch(
          category,
          response.results.categories,
          (cat) => cat.name,
          0.6
        )
        if (fuzzyMatch) {
          logger.info(`Found fuzzy match: ${category} -> ${fuzzyMatch.name}`)
          return fuzzyMatch.id
        }
      }

      logger.info(
        `No matching category found for "${categoryString}", using fallback ID: ${this.OTHER_CATEGORY_ID} (Other)`
      )
      return this.OTHER_CATEGORY_ID

    } catch (error) {
      logger.error(`Failed to handle category "${categoryString}"`, error)
      return this.OTHER_CATEGORY_ID
    }
  }
}