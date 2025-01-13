// services/niceboard/LocationService.ts
// ✅

import { logger } from '@utils'
import { BaseNiceboardService } from './base/BaseNiceboardService'

interface Location {
  id: number
  name: string
}

interface LocationsApiResponse {
  total_count: number
  locations: Location[]
}

interface LocationResponse {
  error: boolean
  results: {
    location: Location
  }
}

interface CreateLocationPayload {
  name: string
}

export class LocationService extends BaseNiceboardService {
  async getLocationId(
    city?: string,
    state?: string,
    country?: string,
  ): Promise<number | undefined> {
    try {
      if (!city && !state && !country) {
        return undefined
      }

      const locationParts = [city, state, country].filter(Boolean)
      const locationString = locationParts.join(', ').toLowerCase()

      const cachedId = this.cache.get(locationString)
      if (cachedId) {
        logger.info(`Location "${locationString}" found in cache: ${cachedId}`)
        return cachedId
      }

      const response = await this.makeRequest<LocationsApiResponse>(
        '/locations',
        {
          method: 'GET',
          params: { name: locationString },
        },
      )

      const location = response.results.locations.find(
        (loc: Location) => loc.name.toLowerCase() === locationString,
      )

      if (location) {
        this.cache.set(locationString, location.id)
        logger.info(
          `Location "${locationString}" found in Niceboard: ${location.id}`,
        )
        return location.id
      }

      const newLocation = await this.createLocation({ name: locationString })
      const newLocationId = newLocation.results.location.id
      this.cache.set(locationString, newLocationId)
      return newLocationId
    } catch (error) {
      logger.error(
        `Failed to handle location "${[city, state, country].join(', ')}"`,
        error,
      )
      throw error
    }
  }

  private async createLocation(
    payload: CreateLocationPayload,
  ): Promise<LocationResponse> {
    return this.makeRequest('/locations', {
      method: 'POST',
      data: payload,
    })
  }

  async fetchAllLocations(): Promise<Map<string, number>> {
    const response = await this.makeRequest<LocationsApiResponse>(
      '/locations',
      {
        method: 'GET',
      },
    )

    const locationsMap = new Map<string, number>()
    response.results.locations.forEach((location: Location) => {
      locationsMap.set(location.name.toLowerCase(), location.id)
    })
    return locationsMap
  }
}
