// testLocation.ts
import { niceboardConfig } from '@config/niceboard'
import { LocationService } from '@services/niceboard/LocationService'

async function testLocationService() {
  const service = new LocationService(niceboardConfig)

  try {
    console.log('Fetching all locations...')
    const allLocations = await service.fetchAllLocations()

    const city = 'New York'
    const state = 'NY'
    const country = 'USA'
    console.log(`\nTesting location lookup for: ${city}, ${state}, ${country}`)
    const locationId = await service.getLocationId(city, state, country)
    console.log('Result:', {
      locationString: `${city}, ${state}, ${country}`,
      locationId,
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

testLocationService()
