// services/NiceboardLocationService.ts
import axios from 'axios';
import { Location, LocationResponse, NiceboardConfig } from '@localtypes/Niceboard';
import { niceboardConfig } from '@config/niceboard';

export class NiceboardLocationService {
  private readonly config: NiceboardConfig;
  private locationCache: Map<string, number>;
 
  constructor(config: Partial<NiceboardConfig> = {}) {
    this.config = { ...niceboardConfig, ...config };
    this.locationCache = new Map();
  }
 
  async getOrCreateLocation(city?: string, state?: string, country?: string): Promise<number | undefined> {
    if (!city && !state && !country) return undefined;
 
    const locationParts = [city, state, country].filter(Boolean);
    const locationString = locationParts.join(', ');
 
    // Check cache first
    const cachedId = this.locationCache.get(locationString);
    if (cachedId) {
      console.log(`Using cached location ID for "${locationString}": ${cachedId}`);
      return cachedId;
    }
 
    try {
      // Try to find existing location
      const existingLocation = await this.findLocation(locationString);
      if (existingLocation) {
        const locationId = existingLocation.id;
        this.locationCache.set(locationString, locationId);
        console.log(`Found existing location "${locationString}" with ID: ${locationId}`);
        return locationId;
      }
 
      // Create new location if it doesn't exist
      const response = await axios.post(
        `${this.config.apiBaseUrl}/locations`,
        { name: locationString },
        {
          params: { key: this.config.apiKey },
          headers: { 'Content-Type': 'application/json' }
        }
      );
 
      if (!response.data.error) {
        const locationId = response.data.results.location.id;
        this.locationCache.set(locationString, locationId);
        console.log(`Created new location "${locationString}" with ID: ${locationId}`);
        return locationId;
      }
 
      console.warn(`Failed to create location "${locationString}": ${response.data.message || 'Unknown error'}`);
      return undefined;
    } catch (error) {
      console.error(`Failed to handle location "${locationString}":`, error);
      return undefined;
    }
  }
 
  private async findLocation(locationString: string): Promise<{ id: number } | null> {
    try {
      const response = await axios.get(
        `${this.config.apiBaseUrl}/locations`,
        {
          params: { 
            key: this.config.apiKey,
            name: locationString
          }
        }
      );
 
      if (response.data?.results?.locations?.length > 0) {
        return response.data.results.locations[0];
      }
 
      return null;
    } catch (error) {
      console.warn(`Failed to search for location "${locationString}":`, error);
      return null;
    }
  }
 }